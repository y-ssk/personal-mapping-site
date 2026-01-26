#!/bin/bash
#
# migrate_to_railway.sh - Render → Railway 移行スクリプト
#
# 使用方法:
#   ./scripts/deploy/migrate_to_railway.sh [options]
#
# 実行内容:
#   1. Renderデータベースのバックアップ
#   2. Railwayデータベースへの復元
#   3. PostGIS拡張の有効化
#   4. マイグレーション実行
#   5. ヘルスチェック
#
# 前提条件:
#   - psql コマンドがインストール済み
#   - RENDER_DATABASE_URL 環境変数が設定済み
#   - RAILWAY_DATABASE_URL 環境変数が設定済み
#   - RAILWAY_API_URL 環境変数が設定済み

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# デフォルト値
DRY_RUN=false
SKIP_BACKUP=false
SKIP_RESTORE=false
SKIP_HEALTH_CHECK=false
BACKUP_DIR="${PROJECT_ROOT}/backups"
BACKUP_FILE=""

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

show_help() {
    cat << EOF
migrate_to_railway.sh - Render → Railway 移行スクリプト

使用方法:
    ./scripts/deploy/migrate_to_railway.sh [options]

オプション:
    --help              このヘルプを表示
    --dry-run           実際の変更を行わず、実行内容を表示
    --skip-backup       バックアップをスキップ（既存のバックアップを使用）
    --skip-restore      復元をスキップ
    --skip-health-check ヘルスチェックをスキップ
    --backup-file FILE  使用するバックアップファイルを指定
    --backup-dir DIR    バックアップディレクトリを指定（デフォルト: ./backups）

環境変数（必須）:
    RENDER_DATABASE_URL   Renderの外部データベースURL
    RAILWAY_DATABASE_URL  Railwayの公開データベースURL
    RAILWAY_API_URL       RailwayバックエンドAPIのURL

環境変数（オプション）:
    VERCEL_PROJECT_ID     VercelプロジェクトID（再デプロイ用）
    VERCEL_TOKEN          Vercelトークン（再デプロイ用）

例:
    # 完全な移行を実行
    export RENDER_DATABASE_URL="postgres://..."
    export RAILWAY_DATABASE_URL="postgres://..."
    export RAILWAY_API_URL="https://xxx.railway.app"
    ./scripts/deploy/migrate_to_railway.sh

    # ドライランで確認
    ./scripts/deploy/migrate_to_railway.sh --dry-run

    # 既存のバックアップを使用
    ./scripts/deploy/migrate_to_railway.sh --skip-backup --backup-file backups/backup_20250125.sql

注意:
    - 移行前にRailwayでPostgreSQLサービスを作成し、Public Networkingを有効化してください
    - 移行完了後、RailwayのPublic Networkingを無効化してください
    - ロールバック方法は docs/setup/RAILWAY_MIGRATION.md を参照

EOF
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help)
                show_help
                exit 0
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --skip-restore)
                SKIP_RESTORE=true
                shift
                ;;
            --skip-health-check)
                SKIP_HEALTH_CHECK=true
                shift
                ;;
            --backup-file)
                shift
                BACKUP_FILE="$1"
                shift
                ;;
            --backup-dir)
                shift
                BACKUP_DIR="$1"
                shift
                ;;
            *)
                log_error "不明なオプション: $1"
                echo "ヘルプ: ./scripts/deploy/migrate_to_railway.sh --help"
                exit 1
                ;;
        esac
    done
}

check_prerequisites() {
    log_info "前提条件を確認中..."

    # psqlコマンドの確認
    if ! command -v psql &> /dev/null; then
        log_error "psql コマンドが見つかりません"
        echo "インストール: sudo apt-get install postgresql-client"
        exit 1
    fi

    # curlコマンドの確認
    if ! command -v curl &> /dev/null; then
        log_error "curl コマンドが見つかりません"
        exit 1
    fi

    # 環境変数の確認
    if [[ "$SKIP_BACKUP" == "false" ]] && [[ -z "${RENDER_DATABASE_URL:-}" ]]; then
        log_error "RENDER_DATABASE_URL が設定されていません"
        exit 1
    fi

    if [[ "$SKIP_RESTORE" == "false" ]] && [[ -z "${RAILWAY_DATABASE_URL:-}" ]]; then
        log_error "RAILWAY_DATABASE_URL が設定されていません"
        exit 1
    fi

    if [[ "$SKIP_HEALTH_CHECK" == "false" ]] && [[ -z "${RAILWAY_API_URL:-}" ]]; then
        log_error "RAILWAY_API_URL が設定されていません"
        exit 1
    fi

    # バックアップファイルの確認（--skip-backupの場合）
    if [[ "$SKIP_BACKUP" == "true" ]] && [[ -z "$BACKUP_FILE" ]]; then
        log_error "--skip-backup を指定した場合、--backup-file も指定してください"
        exit 1
    fi

    if [[ -n "$BACKUP_FILE" ]] && [[ ! -f "$BACKUP_FILE" ]]; then
        log_error "バックアップファイルが見つかりません: $BACKUP_FILE"
        exit 1
    fi

    log_success "前提条件OK"
}

backup_render_database() {
    if [[ "$SKIP_BACKUP" == "true" ]]; then
        log_info "バックアップをスキップ（--skip-backup）"
        return
    fi

    log_info "Renderデータベースをバックアップ中..."

    # バックアップディレクトリ作成
    mkdir -p "$BACKUP_DIR"

    # バックアップファイル名
    BACKUP_FILE="${BACKUP_DIR}/backup_$(date +%Y%m%d_%H%M%S).sql"

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "[DRY-RUN] pg_dump \"RENDER_DATABASE_URL\" > $BACKUP_FILE"
    else
        log_info "バックアップ先: $BACKUP_FILE"

        if pg_dump "$RENDER_DATABASE_URL" > "$BACKUP_FILE"; then
            local size
            size=$(du -h "$BACKUP_FILE" | cut -f1)
            log_success "バックアップ完了: $BACKUP_FILE ($size)"
        else
            log_error "バックアップに失敗しました"
            exit 1
        fi
    fi
}

enable_postgis() {
    log_info "PostGIS拡張を有効化中..."

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "[DRY-RUN] psql \"RAILWAY_DATABASE_URL\" -c \"CREATE EXTENSION IF NOT EXISTS postgis;\""
    else
        if psql "$RAILWAY_DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>/dev/null; then
            log_success "PostGIS拡張が有効化されました"
        else
            log_warning "PostGIS拡張の有効化に失敗（既に有効化されている可能性）"
        fi

        # PostGISバージョン確認
        local postgis_version
        postgis_version=$(psql "$RAILWAY_DATABASE_URL" -t -c "SELECT PostGIS_Version();" 2>/dev/null | tr -d ' ')
        if [[ -n "$postgis_version" ]]; then
            log_info "PostGISバージョン: $postgis_version"
        fi
    fi
}

restore_to_railway() {
    if [[ "$SKIP_RESTORE" == "true" ]]; then
        log_info "復元をスキップ（--skip-restore）"
        return
    fi

    log_info "Railwayデータベースへ復元中..."

    if [[ -z "$BACKUP_FILE" ]]; then
        log_error "バックアップファイルが指定されていません"
        exit 1
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "[DRY-RUN] psql \"RAILWAY_DATABASE_URL\" < $BACKUP_FILE"
    else
        log_info "復元元: $BACKUP_FILE"

        # 既存データの警告
        log_warning "Railwayデータベースに既存データがある場合、上書きされます"
        echo -n "続行しますか？ (y/N): "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            log_info "復元をキャンセルしました"
            exit 0
        fi

        if psql "$RAILWAY_DATABASE_URL" < "$BACKUP_FILE" 2>&1 | tail -5; then
            log_success "復元完了"
        else
            log_error "復元に失敗しました"
            exit 1
        fi
    fi
}

run_migrations() {
    log_info "マイグレーションを確認中..."

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "[DRY-RUN] Railway上でマイグレーションを実行"
        echo "[DRY-RUN] python manage.py migrate"
    else
        log_info "Railwayダッシュボードで以下を実行してください:"
        echo ""
        echo "  1. バックエンドサービスを選択"
        echo "  2. Settings → Deploy → Shell を開く"
        echo "  3. 以下のコマンドを実行:"
        echo ""
        echo "     cd backend"
        echo "     python manage.py showmigrations"
        echo "     python manage.py migrate"
        echo ""
        echo -n "マイグレーションが完了したらEnterを押してください..."
        read -r
        log_success "マイグレーション確認完了"
    fi
}

health_check() {
    if [[ "$SKIP_HEALTH_CHECK" == "true" ]]; then
        log_info "ヘルスチェックをスキップ（--skip-health-check）"
        return
    fi

    log_info "ヘルスチェック実行中..."

    local health_url="${RAILWAY_API_URL}/api/v1/health/"

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "[DRY-RUN] curl -s -o /dev/null -w \"%{http_code}\" $health_url"
    else
        log_info "ヘルスチェックURL: $health_url"

        local max_retries=5
        local retry_count=0
        local http_code

        while [[ $retry_count -lt $max_retries ]]; do
            http_code=$(curl -s -o /dev/null -w "%{http_code}" "$health_url" 2>/dev/null || echo "000")

            if [[ "$http_code" == "200" ]]; then
                log_success "ヘルスチェック成功 (HTTP $http_code)"
                return
            fi

            retry_count=$((retry_count + 1))
            log_warning "ヘルスチェック失敗 (HTTP $http_code) - リトライ $retry_count/$max_retries"
            sleep 5
        done

        log_error "ヘルスチェックに失敗しました"
        echo "手動で確認してください: curl $health_url"
        exit 1
    fi
}

print_next_steps() {
    echo ""
    echo "========================================"
    echo "移行完了！次のステップ:"
    echo "========================================"
    echo ""
    echo "1. RailwayのPublic Networkingを無効化"
    echo "   Railway Dashboard → PostgreSQL → Connect → Public Networking: OFF"
    echo ""
    echo "2. Vercel環境変数を更新"
    echo "   VITE_API_BASE_URL=${RAILWAY_API_URL}/api/v1"
    echo ""
    echo "3. Vercelを再デプロイ"
    echo "   Vercel Dashboard → Redeploy"
    echo ""
    echo "4. 動作確認"
    echo "   - ログイン/登録"
    echo "   - データ表示"
    echo "   - 地図機能"
    echo ""
    echo "5. 予算上限設定（$5）"
    echo "   Railway Dashboard → Project Settings → Usage Limits"
    echo ""
    echo "問題が発生した場合のロールバック:"
    echo "   docs/setup/RAILWAY_MIGRATION.md § 4 を参照"
    echo ""
}

main() {
    parse_args "$@"

    echo "========================================"
    echo "Render → Railway 移行スクリプト"
    echo "========================================"
    echo ""

    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "ドライランモード - 実際の変更は行いません"
        echo ""
    fi

    # Step 1: 前提条件確認
    check_prerequisites

    # Step 2: バックアップ
    echo ""
    echo "--- Step 1/5: バックアップ ---"
    backup_render_database

    # Step 3: PostGIS有効化
    echo ""
    echo "--- Step 2/5: PostGIS有効化 ---"
    enable_postgis

    # Step 4: 復元
    echo ""
    echo "--- Step 3/5: データ復元 ---"
    restore_to_railway

    # Step 5: マイグレーション
    echo ""
    echo "--- Step 4/5: マイグレーション ---"
    run_migrations

    # Step 6: ヘルスチェック
    echo ""
    echo "--- Step 5/5: ヘルスチェック ---"
    health_check

    # 完了
    if [[ "$DRY_RUN" == "false" ]]; then
        print_next_steps
    else
        echo ""
        log_info "[DRY-RUN] 完了 - 実際の変更は行われていません"
    fi
}

main "$@"
