#!/bin/bash
#
# review_changes.sh - 変更レビュースクリプト
#
# 使用方法: ./scripts/claude/review_changes.sh <task-id> [options]
#
# 実行内容:
#   1. git diffで変更確認
#   2. 追加/変更ファイル一覧表示
#   3. テスト実行
#   4. Lint実行
#   5. 承認/却下プロンプト

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# デフォルト値
DRY_RUN=false
TASK_ID=""

show_help() {
    cat << EOF
review_changes.sh - 変更レビュースクリプト

使用方法:
    ./scripts/claude/review_changes.sh <task-id> [options]

引数:
    task-id     タスクID（例: 004, D005）

オプション:
    --help      このヘルプを表示
    --dry-run   実際の変更を行わず、実行内容を表示

実行内容:
    1. git diffで変更確認
    2. 追加/変更ファイル一覧表示
    3. テスト実行（Docker環境がある場合）
    4. Lint実行（Docker環境がある場合）
    5. 承認/却下プロンプト

例:
    ./scripts/claude/review_changes.sh 004
    ./scripts/claude/review_changes.sh D005 --dry-run
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
            -*)
                echo "エラー: 不明なオプション: $1" >&2
                echo "ヘルプ: ./scripts/claude/review_changes.sh --help" >&2
                exit 1
                ;;
            *)
                if [[ -z "$TASK_ID" ]]; then
                    TASK_ID="$1"
                else
                    echo "エラー: 引数が多すぎます" >&2
                    exit 1
                fi
                shift
                ;;
        esac
    done

    if [[ -z "$TASK_ID" ]]; then
        echo "エラー: task-idが必要です" >&2
        echo "ヘルプ: ./scripts/claude/review_changes.sh --help" >&2
        exit 1
    fi
}

run_backend_tests() {
    echo "--- Backendテスト ---"
    if docker-compose ps 2>/dev/null | grep -q "backend"; then
        docker-compose exec -T backend pytest --tb=short 2>/dev/null || echo "(テスト失敗またはテストなし)"
    else
        echo "(Docker環境が起動していないためスキップ)"
    fi
}

run_backend_lint() {
    echo "--- Backend Lint ---"
    if docker-compose ps 2>/dev/null | grep -q "backend"; then
        echo "Black:"
        docker-compose exec -T backend black --check . 2>/dev/null || echo "(Blackチェック失敗)"
        echo ""
        echo "flake8:"
        docker-compose exec -T backend flake8 . 2>/dev/null || echo "(flake8チェック失敗)"
    else
        echo "(Docker環境が起動していないためスキップ)"
    fi
}

run_frontend_tests() {
    echo "--- Frontendテスト ---"
    if docker-compose ps 2>/dev/null | grep -q "frontend"; then
        docker-compose exec -T frontend npm test -- --watchAll=false 2>/dev/null || echo "(テスト失敗またはテストなし)"
    else
        echo "(Docker環境が起動していないためスキップ)"
    fi
}

run_frontend_lint() {
    echo "--- Frontend Lint ---"
    if docker-compose ps 2>/dev/null | grep -q "frontend"; then
        docker-compose exec -T frontend npm run lint 2>/dev/null || echo "(Lintチェック失敗)"
    else
        echo "(Docker環境が起動していないためスキップ)"
    fi
}

main() {
    parse_args "$@"

    echo "=== 変更レビュー: #${TASK_ID} ==="
    echo ""

    local task_dir="${PROJECT_ROOT}/tasks/${TASK_ID}"

    if $DRY_RUN; then
        echo "[DRY-RUN] 以下の操作を実行します:"
        echo ""
        echo "1. git statusで変更ファイル確認"
        echo "2. git diffで変更内容表示"
        echo "3. Backendテスト実行（Docker環境がある場合）"
        echo "4. Backend Lint実行（Docker環境がある場合）"
        echo "5. Frontendテスト実行（Docker環境がある場合）"
        echo "6. Frontend Lint実行（Docker環境がある場合）"
        echo "7. 承認/却下プロンプト表示"
        echo ""
        echo "[DRY-RUN] 実際の変更は行われませんでした"
        exit 0
    fi

    # 1. 変更ファイル一覧
    echo "=== 1. 変更ファイル一覧 ==="
    echo ""
    git status --short
    echo ""

    # 2. git diff
    echo "=== 2. 変更内容（git diff --stat） ==="
    echo ""
    git diff --stat
    echo ""

    # 詳細差分を見るか確認
    read -p "詳細な差分を表示しますか？ [y/N]: " show_diff
    if [[ "$show_diff" =~ ^[Yy]$ ]]; then
        git diff | head -200
        echo ""
        echo "(200行以上の場合は省略されています)"
        echo ""
    fi

    # 3. テスト実行
    echo "=== 3. テスト実行 ==="
    echo ""
    read -p "テストを実行しますか？ [y/N]: " run_tests
    if [[ "$run_tests" =~ ^[Yy]$ ]]; then
        run_backend_tests
        echo ""
        run_frontend_tests
    else
        echo "(スキップ)"
    fi
    echo ""

    # 4. Lint実行
    echo "=== 4. Lint実行 ==="
    echo ""
    read -p "Lintを実行しますか？ [y/N]: " run_lint
    if [[ "$run_lint" =~ ^[Yy]$ ]]; then
        run_backend_lint
        echo ""
        run_frontend_lint
    else
        echo "(スキップ)"
    fi
    echo ""

    # 5. 承認/却下
    echo "=== 5. レビュー結果 ==="
    echo ""
    echo "変更を承認しますか？"
    echo "  [a] 承認 - commit_and_push.sh へ進む"
    echo "  [r] 却下 - 修正が必要"
    echo "  [c] キャンセル"
    echo ""
    read -p "選択 [a/r/c]: " review_result

    case "$review_result" in
        a|A)
            echo ""
            echo "承認されました。"
            echo ""
            echo "次のステップ:"
            echo "  ./scripts/claude/commit_and_push.sh ${TASK_ID}"
            ;;
        r|R)
            echo ""
            echo "却下されました。修正が必要です。"
            echo ""
            echo "修正後、再度レビューを実行してください:"
            echo "  ./scripts/claude/review_changes.sh ${TASK_ID}"
            ;;
        *)
            echo ""
            echo "キャンセルされました。"
            ;;
    esac
}

main "$@"
