#!/bin/bash
#
# check_item.sh - チェックリスト項目更新スクリプト
#
# 使用方法: ./scripts/tasks/check_item.sh <task-id> <item-text> [options]
#
# 実行内容:
#   TASKS.mdのタスクチェックリスト項目をチェック

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TASKS_FILE="${PROJECT_ROOT}/docs/TASKS.md"

# デフォルト値
DRY_RUN=false
TASK_ID=""
ITEM_TEXT=""

show_help() {
    cat << EOF
check_item.sh - チェックリスト項目更新スクリプト

使用方法:
    ./scripts/tasks/check_item.sh <task-id> <item-text> [options]

引数:
    task-id     タスクID（例: 004, D005）
    item-text   チェックする項目のテキスト（部分一致）

オプション:
    --help      このヘルプを表示
    --dry-run   実際の変更を行わず、実行内容を表示

説明:
    指定されたタスクのチェックリストで、item-textに一致する
    項目を [ ] から [x] に変更します。

例:
    ./scripts/tasks/check_item.sh 004 "Userモデル作成"
    ./scripts/tasks/check_item.sh D005 "setup_task.sh"
    ./scripts/tasks/check_item.sh 004 "テスト作成" --dry-run
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
                echo "ヘルプ: ./scripts/tasks/check_item.sh --help" >&2
                exit 1
                ;;
            *)
                if [[ -z "$TASK_ID" ]]; then
                    TASK_ID="$1"
                elif [[ -z "$ITEM_TEXT" ]]; then
                    ITEM_TEXT="$1"
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
        echo "ヘルプ: ./scripts/tasks/check_item.sh --help" >&2
        exit 1
    fi

    if [[ -z "$ITEM_TEXT" ]]; then
        echo "エラー: item-textが必要です" >&2
        echo "ヘルプ: ./scripts/tasks/check_item.sh --help" >&2
        exit 1
    fi
}

main() {
    parse_args "$@"

    echo "=== チェックリスト更新: #${TASK_ID} ==="
    echo "項目: ${ITEM_TEXT}"
    echo ""

    if [[ ! -f "$TASKS_FILE" ]]; then
        echo "エラー: TASKS.mdが見つかりません: ${TASKS_FILE}" >&2
        exit 1
    fi

    # タスクセクションを特定
    local task_pattern="#${TASK_ID} "
    local task_pattern_d="#D${TASK_ID} "

    if ! grep -q "$task_pattern\|$task_pattern_d" "$TASKS_FILE"; then
        echo "エラー: タスク #${TASK_ID} が見つかりません" >&2
        exit 1
    fi

    # 該当する未チェック項目を検索
    local escaped_item
    escaped_item=$(printf '%s\n' "$ITEM_TEXT" | sed 's/[[\.*^$()+?{|]/\\&/g')

    # タスクセクション内で該当項目を探す
    if ! grep -q "\[ \].*${escaped_item}" "$TASKS_FILE"; then
        # 既にチェック済みかどうか確認
        if grep -q "\[x\].*${escaped_item}" "$TASKS_FILE"; then
            echo "項目は既にチェック済みです"
            exit 0
        else
            echo "エラー: 項目 '${ITEM_TEXT}' が見つかりません" >&2
            echo ""
            echo "ヒント: TASKS.mdのチェックリストを確認してください"
            exit 1
        fi
    fi

    if $DRY_RUN; then
        echo "[DRY-RUN] 以下の変更を行います:"
        echo ""
        echo "ファイル: ${TASKS_FILE}"
        echo "変更: [ ] ${ITEM_TEXT} → [x] ${ITEM_TEXT}"
        echo ""

        # 現在の行を表示
        echo "現在の行:"
        grep "\[ \].*${escaped_item}" "$TASKS_FILE" | head -1 || true
        echo ""

        echo "[DRY-RUN] 実際の変更は行われませんでした"
        exit 0
    fi

    # sedで [ ] を [x] に置換（最初の一致のみ）
    local temp_file="${TASKS_FILE}.tmp"

    # awkを使用して最初の一致のみを置換
    awk -v pattern="$ITEM_TEXT" '
    BEGIN { replaced = 0 }
    {
        if (replaced == 0 && /\[ \]/ && index($0, pattern) > 0) {
            sub(/\[ \]/, "[x]")
            replaced = 1
        }
        print
    }
    ' "$TASKS_FILE" > "$temp_file"

    mv "$temp_file" "$TASKS_FILE"

    echo "更新完了: [x] ${ITEM_TEXT}"
    echo ""

    # 更新後の行を表示
    echo "更新後:"
    grep "\[x\].*${escaped_item}" "$TASKS_FILE" | head -1 || true
}

main "$@"
