#!/bin/bash
#
# backup_database.sh - データベースバックアップスクリプト
#
# 使用方法:
#   ./scripts/deploy/backup_database.sh [options]
#
# 実行内容:
#   1. PostgreSQLデータベースのバックアップ（pg_dump）
#   2. バックアップファイルの圧縮（オプション）
#   3. 古いバックアップの自動削除（オプション）
#
# 前提条件:
#   - pg_dump コマンドがインストール済み
#   - DATABASE_URL 環境変数が設定済み

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
COMPRESS=false
BACKUP_DIR="${PROJECT_ROOT}/backups"
RETENTION_DAYS=30
OUTPUT_FILE=""

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
backup_database.sh - データベースバックアップスクリプト

使用方法:
    ./scripts/deploy/backup_database.sh [options]

オプション:
    --help              このヘルプを表示
    --dry-run           実際の変更を行わず、実行内容を表示
    --compress          バックアップファイルをgzip圧縮（.sql.gz）
    --output FILE       出力ファイル名を指定（デフォルト: backup_YYYYMMDD_HHMMSS.sql）
    --backup-dir DIR    バックアップディレクトリを指定（デフォルト: ./backups）
    --retention DAYS    古いバックアップの保持日数（デフォルト: 30、0で削除無効）
    --cleanup-only      バックアップせず古いファイルの削除のみ実行

環境変数（必須）:
    DATABASE_URL        データベース接続URL（postgres://...）

環境変数（オプション）:
    RENDER_DATABASE_URL   Renderの外部データベースURL（DATABASE_URLの代替）
    RAILWAY_DATABASE_URL  Railwayの公開データベースURL（DATABASE_URLの代替）

例:
    # 基本的なバックアップ
    export DATABASE_URL="postgres://user:pass@host:5432/db"
    ./scripts/deploy/backup_database.sh

    # 圧縮してバックアップ
    ./scripts/deploy/backup_database.sh --compress

    # 特定のファイル名で出力
    ./scripts/deploy/backup_database.sh --output my_backup.sql

    # Renderデータベースをバックアップ
    export RENDER_DATABASE_URL="postgres://..."
    ./scripts/deploy/backup_database.sh

    # 古いバックアップを7日で削除
    ./scripts/deploy/backup_database.sh --retention 7

    # ドライランで確認
    ./scripts/deploy/backup_database.sh --dry-run

注意:
    - バックアップファイルには機密情報が含まれます
    - .gitignoreでbackups/ディレクトリは除外されています
    - 本番環境では定期的なバックアップを推奨

EOF
}

parse_args() {
    CLEANUP_ONLY=false

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
            --compress)
                COMPRESS=true
                shift
                ;;
            --output)
                shift
                OUTPUT_FILE="$1"
                shift
                ;;
            --backup-dir)
                shift
                BACKUP_DIR="$1"
                shift
                ;;
            --retention)
                shift
                RETENTION_DAYS="$1"
                shift
                ;;
            --cleanup-only)
                CLEANUP_ONLY=true
                shift
                ;;
            *)
                log_error "不明なオプション: $1"
                echo "ヘルプ: ./scripts/deploy/backup_database.sh --help"
                exit 1
                ;;
        esac
    done
}

check_prerequisites() {
    log_info "前提条件を確認中..."

    # pg_dumpコマンドの確認
    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump コマンドが見つかりません"
        echo "インストール: sudo apt-get install postgresql-client"
        exit 1
    fi

    # DATABASE_URLの確認（優先順位: DATABASE_URL > RENDER_DATABASE_URL > RAILWAY_DATABASE_URL）
    if [[ -z "${DATABASE_URL:-}" ]]; then
        if [[ -n "${RENDER_DATABASE_URL:-}" ]]; then
            DATABASE_URL="$RENDER_DATABASE_URL"
            log_info "RENDER_DATABASE_URLを使用"
        elif [[ -n "${RAILWAY_DATABASE_URL:-}" ]]; then
            DATABASE_URL="$RAILWAY_DATABASE_URL"
            log_info "RAILWAY_DATABASE_URLを使用"
        else
            log_error "DATABASE_URL が設定されていません"
            echo "設定例: export DATABASE_URL=\"postgres://user:pass@host:5432/db\""
            exit 1
        fi
    fi

    log_success "前提条件OK"
}

create_backup_dir() {
    if [[ ! -d "$BACKUP_DIR" ]]; then
        if [[ "$DRY_RUN" == "true" ]]; then
            echo "[DRY-RUN] mkdir -p $BACKUP_DIR"
        else
            mkdir -p "$BACKUP_DIR"
            log_info "バックアップディレクトリを作成: $BACKUP_DIR"
        fi
    fi
}

generate_filename() {
    if [[ -n "$OUTPUT_FILE" ]]; then
        echo "$OUTPUT_FILE"
    else
        local timestamp
        timestamp=$(date +%Y%m%d_%H%M%S)
        if [[ "$COMPRESS" == "true" ]]; then
            echo "backup_${timestamp}.sql.gz"
        else
            echo "backup_${timestamp}.sql"
        fi
    fi
}

backup_database() {
    local filename
    filename=$(generate_filename)
    local filepath="${BACKUP_DIR}/${filename}"

    log_info "データベースをバックアップ中..."
    log_info "出力先: $filepath"

    if [[ "$DRY_RUN" == "true" ]]; then
        if [[ "$COMPRESS" == "true" ]]; then
            echo "[DRY-RUN] pg_dump \"DATABASE_URL\" | gzip > $filepath"
        else
            echo "[DRY-RUN] pg_dump \"DATABASE_URL\" > $filepath"
        fi
    else
        if [[ "$COMPRESS" == "true" ]]; then
            if pg_dump "$DATABASE_URL" | gzip > "$filepath"; then
                local size
                size=$(du -h "$filepath" | cut -f1)
                log_success "バックアップ完了: $filepath ($size)"
            else
                log_error "バックアップに失敗しました"
                rm -f "$filepath"
                exit 1
            fi
        else
            if pg_dump "$DATABASE_URL" > "$filepath"; then
                local size
                size=$(du -h "$filepath" | cut -f1)
                log_success "バックアップ完了: $filepath ($size)"
            else
                log_error "バックアップに失敗しました"
                rm -f "$filepath"
                exit 1
            fi
        fi
    fi

    echo "$filepath"
}

cleanup_old_backups() {
    if [[ "$RETENTION_DAYS" -eq 0 ]]; then
        log_info "古いバックアップの削除はスキップ（--retention 0）"
        return
    fi

    log_info "${RETENTION_DAYS}日以上前のバックアップを削除中..."

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "[DRY-RUN] find $BACKUP_DIR -name 'backup_*.sql*' -mtime +$RETENTION_DAYS -delete"
        local old_files
        old_files=$(find "$BACKUP_DIR" -name 'backup_*.sql*' -mtime +"$RETENTION_DAYS" 2>/dev/null || true)
        if [[ -n "$old_files" ]]; then
            echo "[DRY-RUN] 削除対象:"
            echo "$old_files" | while read -r f; do echo "  - $f"; done
        else
            echo "[DRY-RUN] 削除対象なし"
        fi
    else
        local deleted_count=0
        while IFS= read -r -d '' file; do
            rm -f "$file"
            log_info "削除: $file"
            deleted_count=$((deleted_count + 1))
        done < <(find "$BACKUP_DIR" -name 'backup_*.sql*' -mtime +"$RETENTION_DAYS" -print0 2>/dev/null || true)

        if [[ $deleted_count -gt 0 ]]; then
            log_success "${deleted_count}個の古いバックアップを削除しました"
        else
            log_info "削除対象のバックアップはありません"
        fi
    fi
}

list_backups() {
    log_info "既存のバックアップ一覧:"
    if [[ -d "$BACKUP_DIR" ]]; then
        local count
        count=$(find "$BACKUP_DIR" -name 'backup_*.sql*' 2>/dev/null | wc -l)
        if [[ $count -gt 0 ]]; then
            find "$BACKUP_DIR" -name 'backup_*.sql*' -exec ls -lh {} \; 2>/dev/null | \
                awk '{print "  " $9 " (" $5 ")"}'
            echo ""
            log_info "合計: ${count}個のバックアップ"
        else
            echo "  （バックアップなし）"
        fi
    else
        echo "  （バックアップディレクトリなし）"
    fi
}

main() {
    parse_args "$@"

    echo "========================================"
    echo "データベースバックアップスクリプト"
    echo "========================================"
    echo ""

    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "ドライランモード - 実際の変更は行いません"
        echo ""
    fi

    # クリーンアップのみの場合
    if [[ "$CLEANUP_ONLY" == "true" ]]; then
        create_backup_dir
        cleanup_old_backups
        list_backups
        exit 0
    fi

    # 前提条件確認
    check_prerequisites

    # バックアップディレクトリ作成
    create_backup_dir

    # バックアップ実行
    backup_database

    # 古いバックアップの削除
    cleanup_old_backups

    # バックアップ一覧表示
    echo ""
    list_backups

    echo ""
    log_success "完了"
}

main "$@"
