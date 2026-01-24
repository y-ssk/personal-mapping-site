#!/bin/bash
#
# create_draft_pr.sh - Draft PR作成スクリプト
#
# 使用方法:
#   ./scripts/claude/create_draft_pr.sh <task-id> [options]
#   ./scripts/claude/create_draft_pr.sh --from-commits [options]
#
# 実行内容:
#   1. GitHub CLI (gh)でDraft PR作成
#   2. PR説明自動生成（タスク情報/コミット履歴から）
#   3. レビュアー割り当て（@me）

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# デフォルト値
DRY_RUN=false
TASK_IDS=()
FROM_COMMITS=false
PR_TITLE=""

show_help() {
    cat << EOF
create_draft_pr.sh - Draft PR作成スクリプト

使用方法:
    ./scripts/claude/create_draft_pr.sh <task-id> [task-id2 ...] [options]
    ./scripts/claude/create_draft_pr.sh --from-commits [options]

引数:
    task-id     タスクID（例: D001, D005）複数指定可

オプション:
    --help          このヘルプを表示
    --dry-run       実際の変更を行わず、実行内容を表示
    --from-commits  コミット履歴からタスク一覧を自動生成
    --title <title> PRタイトルを指定

実行内容:
    1. GitHub CLI (gh)でDraft PR作成
    2. PR説明自動生成（タスク情報/コミット履歴から）
    3. レビュアー割り当て（@me）

前提条件:
    - GitHub CLI (gh) がインストールされていること
    - gh auth login で認証済みであること

例:
    ./scripts/claude/create_draft_pr.sh D006
    ./scripts/claude/create_draft_pr.sh D001 D002 D003 --title "ドキュメント整備"
    ./scripts/claude/create_draft_pr.sh --from-commits --dry-run
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
            --from-commits)
                FROM_COMMITS=true
                shift
                ;;
            --title)
                shift
                PR_TITLE="$1"
                shift
                ;;
            -*)
                echo "エラー: 不明なオプション: $1" >&2
                echo "ヘルプ: ./scripts/claude/create_draft_pr.sh --help" >&2
                exit 1
                ;;
            *)
                TASK_IDS+=("$1")
                shift
                ;;
        esac
    done

    if [[ ${#TASK_IDS[@]} -eq 0 ]] && [[ "$FROM_COMMITS" == "false" ]]; then
        echo "エラー: task-idまたは--from-commitsが必要です" >&2
        echo "ヘルプ: ./scripts/claude/create_draft_pr.sh --help" >&2
        exit 1
    fi
}

get_commits_since_base() {
    local base_branch="$1"
    git log "${base_branch}..HEAD" --oneline --reverse
}

extract_tasks_from_commits() {
    local commits="$1"
    echo "$commits" | grep -oP '#D?[0-9]+' | sort -u || true
}

get_task_title() {
    local task_id="$1"
    local tasks_file="${PROJECT_ROOT}/docs/TASKS.md"

    local line
    line=$(grep "^### .* #${task_id} " "$tasks_file" 2>/dev/null || true)

    if [[ -z "$line" ]]; then
        echo ""
        return
    fi

    echo "$line" | sed 's/^### .* #[A-Z]*[0-9]* //'
}

generate_pr_body_from_commits() {
    local base_branch="$1"
    local commits
    commits=$(get_commits_since_base "$base_branch")

    local task_ids
    task_ids=$(extract_tasks_from_commits "$commits")

    local body="## 実装内容\n\n"

    # コミット一覧
    body+="### コミット一覧\n\n"
    while IFS= read -r commit; do
        body+="- ${commit}\n"
    done <<< "$commits"

    # タスク一覧
    if [[ -n "$task_ids" ]]; then
        body+="\n### 関連タスク\n\n"
        while IFS= read -r task_id; do
            if [[ -n "$task_id" ]]; then
                local title
                title=$(get_task_title "$task_id")
                if [[ -n "$title" ]]; then
                    body+="- ${task_id}: ${title}\n"
                else
                    body+="- ${task_id}\n"
                fi
            fi
        done <<< "$task_ids"
    fi

    body+="\n## チェックリスト\n\n"
    body+="- [x] SPEC.mdに準拠\n"
    body+="- [x] pre-commit通過\n"
    body+="- [ ] CI通過確認\n"
    body+="- [ ] 手動動作確認（レビュアー）\n"

    echo -e "$body"
}

generate_pr_body_from_tasks() {
    local body="## 実装内容\n\n"

    for task_id in "${TASK_IDS[@]}"; do
        local title
        title=$(get_task_title "$task_id")
        if [[ -n "$title" ]]; then
            body+="- **#${task_id}**: ${title}\n"
        else
            body+="- **#${task_id}**\n"
        fi
    done

    body+="\n## チェックリスト\n\n"
    body+="- [x] SPEC.mdに準拠\n"
    body+="- [x] pre-commit通過\n"
    body+="- [ ] CI通過確認\n"
    body+="- [ ] 手動動作確認（レビュアー）\n"

    body+="\n## 関連タスク\n\n"
    for task_id in "${TASK_IDS[@]}"; do
        body+="- #${task_id}\n"
    done

    echo -e "$body"
}

generate_pr_title() {
    local current_branch="$1"

    if [[ -n "$PR_TITLE" ]]; then
        echo "$PR_TITLE"
        return
    fi

    # ブランチ名からタイトルを推測
    local title
    title=$(echo "$current_branch" | sed 's/feature\///' | sed 's/-/ /g' | sed 's/_/ /g')

    # 先頭を大文字に
    title="$(echo "${title:0:1}" | tr '[:lower:]' '[:upper:]')${title:1}"

    echo "$title"
}

main() {
    parse_args "$@"

    echo "=== Draft PR作成 ==="
    echo ""

    # gh コマンドの確認
    if ! command -v gh &> /dev/null; then
        echo "エラー: GitHub CLI (gh) がインストールされていません" >&2
        echo "インストール: https://cli.github.com/" >&2
        exit 1
    fi

    # 現在のブランチ
    local current_branch
    current_branch=$(git rev-parse --abbrev-ref HEAD)

    # ベースブランチ（developまたはmain）
    local base_branch="develop"
    if ! git rev-parse --verify "$base_branch" >/dev/null 2>&1; then
        base_branch="main"
    fi

    # PRタイトル生成
    local pr_title
    pr_title=$(generate_pr_title "$current_branch")

    # PR本文生成
    local pr_body
    if [[ "$FROM_COMMITS" == "true" ]]; then
        pr_body=$(generate_pr_body_from_commits "$base_branch")
    else
        pr_body=$(generate_pr_body_from_tasks)
    fi

    echo "タイトル: ${pr_title}"
    echo "ベースブランチ: ${base_branch}"
    echo "ソースブランチ: ${current_branch}"
    echo ""
    echo "--- PR説明 ---"
    echo -e "$pr_body"
    echo "---------------"
    echo ""

    if $DRY_RUN; then
        echo "[DRY-RUN] 以下の操作を実行します:"
        echo ""
        echo "gh pr create \\"
        echo "  --draft \\"
        echo "  --title \"${pr_title}\" \\"
        echo "  --body \"...\" \\"
        echo "  --base ${base_branch} \\"
        echo "  --assignee @me"
        echo ""
        echo "[DRY-RUN] 実際の変更は行われませんでした"
        exit 0
    fi

    # 確認
    read -p "このPRを作成しますか？ [Y/n]: " confirm
    if [[ "$confirm" =~ ^[Nn]$ ]]; then
        echo "キャンセルしました"
        exit 0
    fi

    # PR作成
    echo "Draft PR作成中..."
    local pr_url
    pr_url=$(gh pr create \
        --draft \
        --title "$pr_title" \
        --body "$(echo -e "$pr_body")" \
        --base "$base_branch" \
        --assignee @me \
        2>&1)

    echo ""
    echo "=== Draft PR作成完了 ==="
    echo ""
    echo "PR URL: ${pr_url}"
    echo ""
    echo "次のステップ:"
    echo "  1. CI通過を確認"
    echo "  2. レビュー & 承認"
    echo "  3. gh pr ready でDraft解除"
    echo "  4. gh pr merge --squash --delete-branch でマージ"
}

main "$@"
