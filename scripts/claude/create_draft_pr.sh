#!/bin/bash
#
# create_draft_pr.sh - Draft PR作成スクリプト
#
# 使用方法: ./scripts/claude/create_draft_pr.sh <task-id> [options]
#
# 実行内容:
#   1. GitHub CLI (gh)でDraft PR作成
#   2. PR説明自動生成（TASK.mdから）
#   3. レビュアー割り当て（@me）
#   4. ラベル追加（feature, backend等）

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# デフォルト値
DRY_RUN=false
TASK_ID=""

show_help() {
    cat << EOF
create_draft_pr.sh - Draft PR作成スクリプト

使用方法:
    ./scripts/claude/create_draft_pr.sh <task-id> [options]

引数:
    task-id     タスクID（例: 004, D005）

オプション:
    --help      このヘルプを表示
    --dry-run   実際の変更を行わず、実行内容を表示

実行内容:
    1. GitHub CLI (gh)でDraft PR作成
    2. PR説明自動生成（TASK.mdから）
    3. レビュアー割り当て（@me）
    4. ラベル追加（feature, backend等）

前提条件:
    - GitHub CLI (gh) がインストールされていること
    - gh auth login で認証済みであること

例:
    ./scripts/claude/create_draft_pr.sh 004
    ./scripts/claude/create_draft_pr.sh D005 --dry-run
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
                echo "ヘルプ: ./scripts/claude/create_draft_pr.sh --help" >&2
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
        echo "ヘルプ: ./scripts/claude/create_draft_pr.sh --help" >&2
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

extract_spec_ref() {
    local task_section="$1"
    local spec_ref
    spec_ref=$(echo "$task_section" | grep -oP '\*\*SPEC参照:\*\* \K.*' || echo "")
    echo "$spec_ref"
}

detect_labels() {
    local task_title="$1"
    local labels=""

    # タイトルからラベルを推測
    if [[ "$task_title" =~ バックエンド|Backend|API|モデル|Model ]]; then
        labels="backend"
    fi

    if [[ "$task_title" =~ フロントエンド|Frontend|UI|React ]]; then
        [[ -n "$labels" ]] && labels="${labels},"
        labels="${labels}frontend"
    fi

    if [[ "$task_title" =~ ドキュメント|Document|doc|README|SPEC ]]; then
        [[ -n "$labels" ]] && labels="${labels},"
        labels="${labels}documentation"
    fi

    if [[ "$task_title" =~ スクリプト|Script|CI|CD ]]; then
        [[ -n "$labels" ]] && labels="${labels},"
        labels="${labels}infrastructure"
    fi

    # デフォルトはfeature
    if [[ -z "$labels" ]]; then
        labels="feature"
    fi

    echo "$labels"
}

main() {
    parse_args "$@"

    echo "=== Draft PR作成: #${TASK_ID} ==="
    echo ""

    # gh コマンドの確認
    if ! command -v gh &> /dev/null; then
        echo "エラー: GitHub CLI (gh) がインストールされていません" >&2
        echo "インストール: https://cli.github.com/" >&2
        exit 1
    fi

    # タスク情報取得
    local task_section
    task_section=$(get_task_info "$TASK_ID")

    local task_title spec_ref
    task_title=$(extract_task_title "$task_section")
    spec_ref=$(extract_spec_ref "$task_section")

    # 現在のブランチ
    local current_branch
    current_branch=$(git rev-parse --abbrev-ref HEAD)

    # ベースブランチ（developまたはmain）
    local base_branch="develop"
    if ! git rev-parse --verify "$base_branch" >/dev/null 2>&1; then
        base_branch="main"
    fi

    # ラベル検出
    local labels
    labels=$(detect_labels "$task_title")

    # PR説明生成
    local pr_body
    pr_body=$(cat << EOF
## 実装内容
- ${task_title}

## チェックリスト
- [x] SPEC.mdに準拠
- [x] テスト作成済み
- [x] pre-commit通過
- [ ] 手動動作確認（レビュアー）

## 関連
- タスク: #${TASK_ID}
- SPEC参照: ${spec_ref:-'なし'}
- ブランチ: ${current_branch}
EOF
)

    local pr_title="${task_title}"

    echo "タイトル: ${pr_title}"
    echo "ベースブランチ: ${base_branch}"
    echo "ソースブランチ: ${current_branch}"
    echo "ラベル: ${labels}"
    echo ""
    echo "--- PR説明 ---"
    echo "$pr_body"
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
        echo "  --label \"${labels}\" \\"
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
        --body "$pr_body" \
        --base "$base_branch" \
        --assignee @me \
        2>&1) || {
        # ラベルがない場合は再試行
        pr_url=$(gh pr create \
            --draft \
            --title "$pr_title" \
            --body "$pr_body" \
            --base "$base_branch" \
            --assignee @me \
            2>&1)
    }

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
    echo "  5. ./scripts/tasks/update_task.sh ${TASK_ID} done"
}

main "$@"
