#!/bin/bash
#
# commit_and_push.sh - Commit & Pushスクリプト
#
# 使用方法: ./scripts/claude/commit_and_push.sh <task-id> [options]
#
# 実行内容:
#   1. pre-commit自動実行（全ファイル）
#   2. Conventional Commitメッセージ生成
#   3. git add .
#   4. git commit
#   5. git push origin <branch>
#   6. TASKS.md更新（進捗更新）

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# デフォルト値
DRY_RUN=false
TASK_ID=""

show_help() {
    cat << EOF
commit_and_push.sh - Commit & Pushスクリプト

使用方法:
    ./scripts/claude/commit_and_push.sh <task-id> [options]

引数:
    task-id     タスクID（例: 004, D005）

オプション:
    --help      このヘルプを表示
    --dry-run   実際の変更を行わず、実行内容を表示

実行内容:
    1. pre-commit自動実行（全ファイル）
    2. Conventional Commitメッセージ生成
    3. git add .
    4. git commit
    5. git push origin <branch>
    6. TASKS.md更新（進捗更新）

例:
    ./scripts/claude/commit_and_push.sh 004
    ./scripts/claude/commit_and_push.sh D005 --dry-run
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
                echo "ヘルプ: ./scripts/claude/commit_and_push.sh --help" >&2
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
        echo "ヘルプ: ./scripts/claude/commit_and_push.sh --help" >&2
        exit 1
    fi
}

get_task_info() {
    local task_id="$1"
    local tasks_file="${PROJECT_ROOT}/docs/TASKS.md"

    if [[ ! -f "$tasks_file" ]]; then
        echo "エラー: TASKS.mdが見つかりません" >&2
        exit 1
    fi

    local task_section
    task_section=$(awk "/^### .* #${task_id} /,/^### /" "$tasks_file" | head -n -1)

    if [[ -z "$task_section" ]]; then
        task_section=$(awk "/^### .* #D${task_id} /,/^### /" "$tasks_file" | head -n -1)
    fi

    if [[ -z "$task_section" ]]; then
        echo "エラー: タスク #${task_id} が見つかりません" >&2
        exit 1
    fi

    echo "$task_section"
}

extract_task_title() {
    local task_section="$1"
    local title
    title=$(echo "$task_section" | head -1 | sed 's/^### .* #[A-Z]*[0-9]* //')
    echo "$title"
}

generate_commit_type() {
    local task_title="$1"
    local commit_type="feat"

    # タイトルからコミットタイプを推測
    if [[ "$task_title" =~ テスト|test ]]; then
        commit_type="test"
    elif [[ "$task_title" =~ ドキュメント|document|doc|README|SPEC ]]; then
        commit_type="docs"
    elif [[ "$task_title" =~ 修正|fix|バグ|bug ]]; then
        commit_type="fix"
    elif [[ "$task_title" =~ リファクタ|refactor ]]; then
        commit_type="refactor"
    elif [[ "$task_title" =~ CI|CD|Actions|デプロイ|deploy ]]; then
        commit_type="ci"
    elif [[ "$task_title" =~ スクリプト|script ]]; then
        commit_type="chore"
    fi

    echo "$commit_type"
}

generate_commit_scope() {
    local task_title="$1"
    local scope=""

    # タイトルからスコープを推測
    if [[ "$task_title" =~ 認証|auth|JWT|OAuth ]]; then
        scope="auth"
    elif [[ "$task_title" =~ Location|場所 ]]; then
        scope="location"
    elif [[ "$task_title" =~ Visit|訪問 ]]; then
        scope="visit"
    elif [[ "$task_title" =~ Trip|旅行 ]]; then
        scope="trip"
    elif [[ "$task_title" =~ Dashboard|ダッシュボード ]]; then
        scope="dashboard"
    elif [[ "$task_title" =~ Claude|スクリプト ]]; then
        scope="scripts"
    fi

    echo "$scope"
}

main() {
    parse_args "$@"

    echo "=== Commit & Push: #${TASK_ID} ==="
    echo ""

    # タスク情報取得
    local task_section
    task_section=$(get_task_info "$TASK_ID")

    local task_title
    task_title=$(extract_task_title "$task_section")

    # 現在のブランチ
    local current_branch
    current_branch=$(git rev-parse --abbrev-ref HEAD)

    # コミットメッセージ生成
    local commit_type commit_scope commit_msg
    commit_type=$(generate_commit_type "$task_title")
    commit_scope=$(generate_commit_scope "$task_title")

    if [[ -n "$commit_scope" ]]; then
        commit_msg="${commit_type}(${commit_scope}): ${task_title}"
    else
        commit_msg="${commit_type}: ${task_title}"
    fi

    echo "タスク: ${task_title}"
    echo "ブランチ: ${current_branch}"
    echo "コミットメッセージ: ${commit_msg}"
    echo ""

    if $DRY_RUN; then
        echo "[DRY-RUN] 以下の操作を実行します:"
        echo ""
        echo "1. pre-commit run --all-files"
        echo "2. git add ."
        echo "3. git commit -m \"${commit_msg}\""
        echo "4. git push origin ${current_branch}"
        echo "5. TASKS.md更新"
        echo ""
        echo "[DRY-RUN] 実際の変更は行われませんでした"
        exit 0
    fi

    # 変更があるか確認
    if [[ -z "$(git status --porcelain)" ]]; then
        echo "警告: コミットする変更がありません"
        exit 0
    fi

    # 1. pre-commit実行
    echo "1. pre-commit実行..."
    if command -v pre-commit &> /dev/null; then
        pre-commit run --all-files || {
            echo ""
            echo "pre-commitが失敗しました。修正してください。"
            exit 1
        }
    else
        echo "   (pre-commitがインストールされていないためスキップ)"
    fi
    echo ""

    # 2. git add
    echo "2. git add..."
    git add .
    echo ""

    # 3. コミットメッセージ確認
    echo "3. コミット..."
    echo "コミットメッセージ: ${commit_msg}"
    read -p "このメッセージでコミットしますか？ [Y/n]: " confirm_commit
    if [[ "$confirm_commit" =~ ^[Nn]$ ]]; then
        read -p "新しいコミットメッセージを入力: " commit_msg
    fi

    git commit -m "$commit_msg"
    echo ""

    # 4. push
    echo "4. git push..."
    git push origin "$current_branch"
    echo ""

    # 5. TASKS.md更新
    echo "5. TASKS.md更新..."
    # 更新は手動で行うか、update_task.shを使用
    echo "   (チェックリストの更新は手動で行ってください)"
    echo ""

    echo "=== Commit & Push完了 ==="
    echo ""
    echo "次のステップ:"
    echo "  ./scripts/claude/create_draft_pr.sh ${TASK_ID}"
}

main "$@"
