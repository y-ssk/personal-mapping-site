#!/bin/bash
#
# run_task.sh - Claude Code実行プロンプト生成スクリプト
#
# 使用方法: ./scripts/claude/run_task.sh <task-id> [options]
#
# 実行内容:
#   1. tasks/<task-id>/TASK.mdを読み込み
#   2. Claude Codeへのプロンプト生成
#   3. tasks/<task-id>/claude_prompt.mdに出力

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# デフォルト値
DRY_RUN=false
TASK_ID=""

show_help() {
    cat << EOF
run_task.sh - Claude Code実行プロンプト生成スクリプト

使用方法:
    ./scripts/claude/run_task.sh <task-id> [options]

引数:
    task-id     タスクID（例: 004, D005）

オプション:
    --help      このヘルプを表示
    --dry-run   実際の変更を行わず、実行内容を表示

実行内容:
    1. tasks/<task-id>/TASK.mdを読み込み
    2. Claude Codeへのプロンプト生成
    3. tasks/<task-id>/claude_prompt.mdに出力

例:
    ./scripts/claude/run_task.sh 004
    ./scripts/claude/run_task.sh D005 --dry-run
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
                echo "ヘルプ: ./scripts/claude/run_task.sh --help" >&2
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
        echo "ヘルプ: ./scripts/claude/run_task.sh --help" >&2
        exit 1
    fi
}

main() {
    parse_args "$@"

    echo "=== Claude Codeプロンプト生成: #${TASK_ID} ==="
    echo ""

    local task_dir="${PROJECT_ROOT}/tasks/${TASK_ID}"
    local task_file="${task_dir}/TASK.md"
    local prompt_file="${task_dir}/claude_prompt.md"

    # TASK.mdの存在確認
    if [[ ! -f "$task_file" ]]; then
        echo "エラー: ${task_file} が見つかりません" >&2
        echo "先に setup_task.sh を実行してください" >&2
        exit 1
    fi

    if $DRY_RUN; then
        echo "[DRY-RUN] 以下の操作を実行します:"
        echo ""
        echo "1. TASK.md読み込み: ${task_file}"
        echo "2. プロンプト生成: ${prompt_file}"
        echo ""
        echo "[DRY-RUN] 実際の変更は行われませんでした"
        exit 0
    fi

    echo "1. TASK.md読み込み..."
    local task_content
    task_content=$(cat "$task_file")

    echo "2. プロンプト生成..."
    cat > "$prompt_file" << EOF
# Claude Code実行プロンプト - タスク #${TASK_ID}

以下のタスクを実装してください。

## 重要な制約

1. **SPEC.mdに厳密に従う** - 仕様と異なる実装はすべて却下されます
2. **余計なことはしない** - 仕様にない機能追加は禁止
3. **テストは必須** - Service層カバレッジ>=80%
4. **ドキュメントは必須** - JSDoc/Docstringを必ず書く

## 参照ドキュメント

- SPEC.md: 技術仕様
- CLAUDE.md: 開発ガイド
- docs/api/openapi.yml: API仕様

## タスク詳細

${task_content}

## 実装手順

1. まず関連するSPECセクションを読んでください
2. 既存コードのパターンに従ってください
3. テストを必ず作成してください
4. 実装後、変更内容を報告してください

---

*このプロンプトは自動生成されました*
EOF

    echo ""
    echo "=== プロンプト生成完了 ==="
    echo ""
    echo "生成されたファイル: ${prompt_file}"
    echo ""
    echo "次のステップ:"
    echo "  1. Claude Codeで ${prompt_file} を開く"
    echo "  2. プロンプトをClaude Codeに貼り付けて実行"
    echo "  3. 実装完了後: ./scripts/claude/review_changes.sh ${TASK_ID}"
}

main "$@"
