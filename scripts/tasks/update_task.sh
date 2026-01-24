#!/bin/bash
#
# update_task.sh - タスクステータス更新スクリプト
#
# 使用方法: ./scripts/tasks/update_task.sh <task-id> <status> [options]
#
# 実行内容:
#   TASKS.mdのタスクステータスを更新

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TASKS_FILE="${PROJECT_ROOT}/docs/TASKS.md"

# デフォルト値
DRY_RUN=false
TASK_ID=""
STATUS=""

# ステータスマッピング
declare -A STATUS_ICONS=(
    ["pending"]="⬜"
    ["in-progress"]="🔄"
    ["done"]="✅"
    ["blocked"]="🚫"
    ["paused"]="⏸️"
)

show_help() {
    cat << EOF
update_task.sh - タスクステータス更新スクリプト

使用方法:
    ./scripts/tasks/update_task.sh <task-id> <status> [options]

引数:
    task-id     タスクID（例: 004, D005）
    status      新しいステータス:
                  pending     - 未着手
                  in-progress - 作業中
                  done        - 完了
                  blocked     - ブロック中
                  paused      - 保留

オプション:
    --help      このヘルプを表示
    --dry-run   実際の変更を行わず、実行内容を表示

例:
    ./scripts/tasks/update_task.sh 004 in-progress
    ./scripts/tasks/update_task.sh D005 done
    ./scripts/tasks/update_task.sh 004 blocked --dry-run
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
                echo "ヘルプ: ./scripts/tasks/update_task.sh --help" >&2
                exit 1
                ;;
            *)
                if [[ -z "$TASK_ID" ]]; then
                    TASK_ID="$1"
                elif [[ -z "$STATUS" ]]; then
                    STATUS="$1"
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
        echo "ヘルプ: ./scripts/tasks/update_task.sh --help" >&2
        exit 1
    fi

    if [[ -z "$STATUS" ]]; then
        echo "エラー: statusが必要です" >&2
        echo "ヘルプ: ./scripts/tasks/update_task.sh --help" >&2
        exit 1
    fi

    # ステータス検証
    if [[ ! "${STATUS_ICONS[$STATUS]+isset}" ]]; then
        echo "エラー: 不明なステータス: $STATUS" >&2
        echo "有効なステータス: pending, in-progress, done, blocked, paused" >&2
        exit 1
    fi
}

main() {
    parse_args "$@"

    echo "=== タスクステータス更新: #${TASK_ID} → ${STATUS} ==="
    echo ""

    if [[ ! -f "$TASKS_FILE" ]]; then
        echo "エラー: TASKS.mdが見つかりません: ${TASKS_FILE}" >&2
        exit 1
    fi

    local new_icon="${STATUS_ICONS[$STATUS]}"

    # タスク行を検索
    local task_pattern="#${TASK_ID} "
    local task_pattern_d="#D${TASK_ID} "

    if ! grep -q "$task_pattern\|$task_pattern_d" "$TASKS_FILE"; then
        echo "エラー: タスク #${TASK_ID} が見つかりません" >&2
        exit 1
    fi

    if $DRY_RUN; then
        echo "[DRY-RUN] 以下の変更を行います:"
        echo ""
        echo "ファイル: ${TASKS_FILE}"
        echo "変更: タスク #${TASK_ID} のステータスを ${new_icon} (${STATUS}) に更新"
        echo ""

        # 現在の行を表示
        echo "現在の行:"
        grep "### .* #${TASK_ID} \|### .* #D${TASK_ID} " "$TASKS_FILE" || true
        echo ""

        echo "[DRY-RUN] 実際の変更は行われませんでした"
        exit 0
    fi

    # sedでステータスアイコンを更新
    # パターン: ### <icon> #<task-id> <title>
    # 任意のステータスアイコンを新しいものに置換
    local temp_file="${TASKS_FILE}.tmp"

    sed -E "s/^(### )[⬜🔄✅🚫⏸️]+ (#D?${TASK_ID} )/\1${new_icon} \2/" "$TASKS_FILE" > "$temp_file"
    mv "$temp_file" "$TASKS_FILE"

    echo "更新完了: タスク #${TASK_ID} → ${new_icon} (${STATUS})"
    echo ""

    # 更新後の行を表示
    echo "更新後:"
    grep "### .* #${TASK_ID} \|### .* #D${TASK_ID} " "$TASKS_FILE" || true
}

main "$@"
