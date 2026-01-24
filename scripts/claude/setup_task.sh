#!/bin/bash
#
# setup_task.sh - タスク準備スクリプト
#
# 使用方法: ./scripts/claude/setup_task.sh <task-id> [options]
#
# 実行内容:
#   1. tasks/<task-id>/ディレクトリ作成
#   2. SPEC.md該当セクション抽出 → tasks/<task-id>/spec_excerpt.md
#   3. タスクファイル生成 → tasks/<task-id>/TASK.md
#   4. ブランチ作成
#   5. TASKS.md更新（ステータス: 作業中）

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# デフォルト値
DRY_RUN=false
TASK_ID=""

show_help() {
    cat << EOF
setup_task.sh - タスク準備スクリプト

使用方法:
    ./scripts/claude/setup_task.sh <task-id> [options]

引数:
    task-id     タスクID（例: 004, D005）

オプション:
    --help      このヘルプを表示
    --dry-run   実際の変更を行わず、実行内容を表示

実行内容:
    1. tasks/<task-id>/ディレクトリ作成
    2. SPEC.md該当セクション抽出
    3. タスクファイル（TASK.md）生成
    4. ブランチ作成
    5. TASKS.md更新（ステータス: 作業中）

例:
    ./scripts/claude/setup_task.sh 004
    ./scripts/claude/setup_task.sh D005 --dry-run
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
                echo "ヘルプ: ./scripts/claude/setup_task.sh --help" >&2
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
        echo "ヘルプ: ./scripts/claude/setup_task.sh --help" >&2
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

    # タスク情報を抽出（#D006 または #006 形式に対応）
    local task_section
    local start_line end_line

    # タスクヘッダー行を検索（### で始まり #task_id を含む行）
    start_line=$(grep -n "^### .* #${task_id} " "$tasks_file" | head -1 | cut -d: -f1)

    # 見つからない場合、数字のみなら D を付けて検索
    if [[ -z "$start_line" ]] && [[ "$task_id" =~ ^[0-9]+$ ]]; then
        start_line=$(grep -n "^### .* #D${task_id} " "$tasks_file" | head -1 | cut -d: -f1)
    fi

    if [[ -z "$start_line" ]]; then
        echo "エラー: タスク #${task_id} が見つかりません" >&2
        exit 1
    fi

    # 次のタスクヘッダーまでを取得
    end_line=$(tail -n +$((start_line + 1)) "$tasks_file" | grep -n "^### " | head -1 | cut -d: -f1)

    if [[ -n "$end_line" ]]; then
        end_line=$((start_line + end_line - 1))
        task_section=$(sed -n "${start_line},${end_line}p" "$tasks_file")
    else
        task_section=$(tail -n +${start_line} "$tasks_file")
    fi

    echo "$task_section"
}

extract_branch_name() {
    local task_section="$1"
    local branch
    branch=$(echo "$task_section" | grep -oP '\*\*ブランチ:\*\* \K[^\s]+' || echo "")
    echo "$branch"
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

extract_deliverables() {
    local task_section="$1"
    echo "$task_section" | awk '/^\*\*成果物:\*\*$/,/^-/' | tail -n +2 | grep "^  - " | sed 's/^  - //'
}

main() {
    parse_args "$@"

    echo "=== タスク準備: #${TASK_ID} ==="
    echo ""

    # タスク情報取得
    local task_section
    task_section=$(get_task_info "$TASK_ID")

    local task_title branch_name spec_ref
    task_title=$(extract_task_title "$task_section")
    branch_name=$(extract_branch_name "$task_section")
    spec_ref=$(extract_spec_ref "$task_section")

    echo "タスク: ${task_title}"
    echo "ブランチ: ${branch_name:-'(未指定)'}"
    echo "SPEC参照: ${spec_ref:-'(なし)'}"
    echo ""

    local task_dir="${PROJECT_ROOT}/tasks/${TASK_ID}"

    if $DRY_RUN; then
        echo "[DRY-RUN] 以下の操作を実行します:"
        echo ""
        echo "1. ディレクトリ作成: ${task_dir}"
        echo "2. TASK.md生成: ${task_dir}/TASK.md"
        if [[ -n "$spec_ref" ]]; then
            echo "3. SPEC抜粋: ${task_dir}/spec_excerpt.md"
        fi
        if [[ -n "$branch_name" ]]; then
            echo "4. ブランチ作成: ${branch_name}"
        fi
        echo "5. TASKS.md更新: ステータスを作業中に変更"
        echo ""
        echo "[DRY-RUN] 実際の変更は行われませんでした"
        exit 0
    fi

    # 1. ディレクトリ作成
    echo "1. ディレクトリ作成..."
    mkdir -p "$task_dir"

    # 2. TASK.md生成
    echo "2. TASK.md生成..."
    cat > "${task_dir}/TASK.md" << EOF
# タスク #${TASK_ID}: ${task_title}

## 概要
${task_title}

## SPEC参照
${spec_ref:-'なし'}

## タスク情報
${task_section}

## 重要な制約
- SPEC.mdに厳密に従うこと
- 勝手な機能追加禁止
- テスト必須
EOF

    # 3. SPEC抜粋（SPEC参照がある場合）
    if [[ -n "$spec_ref" ]] && [[ -f "${PROJECT_ROOT}/SPEC.md" ]]; then
        echo "3. SPEC抜粋生成..."
        echo "# SPEC.md 抜粋" > "${task_dir}/spec_excerpt.md"
        echo "" >> "${task_dir}/spec_excerpt.md"
        echo "参照: ${spec_ref}" >> "${task_dir}/spec_excerpt.md"
        echo "" >> "${task_dir}/spec_excerpt.md"
        echo "(手動でSPEC.mdから該当セクションを抽出してください)" >> "${task_dir}/spec_excerpt.md"
    fi

    # 4. ブランチ作成
    if [[ -n "$branch_name" ]]; then
        echo "4. ブランチ作成..."
        if git rev-parse --verify "$branch_name" >/dev/null 2>&1; then
            echo "   ブランチ ${branch_name} は既に存在します。チェックアウトします。"
            git checkout "$branch_name"
        else
            git checkout -b "$branch_name"
        fi
    fi

    # 5. TASKS.md更新
    echo "5. TASKS.md更新..."
    "${SCRIPT_DIR}/../tasks/update_task.sh" "$TASK_ID" in-progress 2>/dev/null || true

    echo ""
    echo "=== 準備完了 ==="
    echo ""
    echo "次のステップ:"
    echo "  ./scripts/claude/run_task.sh ${TASK_ID}"
}

main "$@"
