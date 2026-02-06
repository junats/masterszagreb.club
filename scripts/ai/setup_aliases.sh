#!/bin/bash

# TrueTrack Local AI Aliases Setup
# Run from project root: ./scripts/ai/setup_aliases.sh

# Detect Shell
SHELL_CONFIG=""
if [ -n "$ZSH_VERSION" ] || [[ "$SHELL" == *"zsh"* ]]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ] || [[ "$SHELL" == *"bash"* ]]; then
    SHELL_CONFIG="$HOME/.bashrc"
else
    SHELL_CONFIG="$HOME/.profile"
fi

# New paths after restructure
FIX_PATH="$(pwd)/scripts/ai/fix.sh"
DEBATE_PATH="$(pwd)/scripts/ai/debate.py"
AUTOFIX_PATH="$(pwd)/scripts/ai/autofix.py"
GENTEST_PATH="$(pwd)/scripts/ai/gentest.py"

# Helper function
add_alias_if_missing() {
    local name=$1
    local cmd=$2
    local config=$3

    if grep -q "alias $name=" "$config"; then
        echo "✅ Alias '$name' already exists in $config"
    else
        echo "alias $name=\"$cmd\"" >> "$config"
        echo "✨ Added alias '$name'"
    fi
}

echo "" >> "$SHELL_CONFIG"
echo "# TrueTrack Local AI Commands" >> "$SHELL_CONFIG"

add_alias_if_missing "fix" "$FIX_PATH" "$SHELL_CONFIG"
add_alias_if_missing "debate" "python3 $DEBATE_PATH" "$SHELL_CONFIG"
add_alias_if_missing "autofix" "python3 $AUTOFIX_PATH" "$SHELL_CONFIG"
add_alias_if_missing "gentest" "python3 $GENTEST_PATH" "$SHELL_CONFIG"

echo ""
echo "🎉 Setup Complete!"
echo "👉 Run: source $SHELL_CONFIG"
echo ""
echo "Commands:"
echo "  fix <file> \"instruction\"     - Refactor with local AI"
echo "  debate \"question\"            - AI debate synthesis"
echo "  gentest <file>               - Generate Vitest tests"
echo "  autofix <file> \"test_cmd\"    - Auto-fix test failures"
