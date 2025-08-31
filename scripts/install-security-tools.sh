#!/bin/bash

# Script to install security scanning tools for local development
# This mirrors the tools used in GitHub Actions security pipeline

set -e

echo "🛡️  Installing security scanning tools..."
echo ""

# Check if running on macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macOS"
    PACKAGE_MANAGER="brew"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLATFORM="Linux"
    if command -v apt-get &> /dev/null; then
        PACKAGE_MANAGER="apt"
    elif command -v yum &> /dev/null; then
        PACKAGE_MANAGER="yum"
    else
        PACKAGE_MANAGER="manual"
    fi
else
    PLATFORM="Other"
    PACKAGE_MANAGER="manual"
fi

echo "Detected platform: $PLATFORM"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Install TruffleHog (secret scanning)
echo "1️⃣ Installing TruffleHog for secret scanning..."
if command_exists trufflehog; then
    echo "   ✅ TruffleHog already installed"
else
    if [[ "$PACKAGE_MANAGER" == "brew" ]]; then
        brew install trufflesecurity/trufflehog/trufflehog
    else
        # Universal install via curl for Linux/Other
        echo "   Installing TruffleHog via install script..."
        curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -b /usr/local/bin
    fi
    echo "   ✅ TruffleHog installed"
fi

# Install Semgrep (SAST)
echo ""
echo "2️⃣ Installing Semgrep for static analysis..."
if command_exists semgrep; then
    echo "   ✅ Semgrep already installed"
else
    echo "   Installing Semgrep via pip..."
    pip install --upgrade semgrep
    echo "   ✅ Semgrep installed"
fi

# Install Checkov (IaC scanning)
echo ""
echo "3️⃣ Installing Checkov for infrastructure scanning..."
if command_exists checkov; then
    echo "   ✅ Checkov already installed"
else
    echo "   Installing Checkov via pip..."
    pip install --upgrade checkov
    echo "   ✅ Checkov installed"
fi

# Install jq (JSON processing)
echo ""
echo "4️⃣ Installing jq for JSON processing..."
if command_exists jq; then
    echo "   ✅ jq already installed"
else
    if [[ "$PACKAGE_MANAGER" == "brew" ]]; then
        brew install jq
    elif [[ "$PACKAGE_MANAGER" == "apt" ]]; then
        sudo apt-get update && sudo apt-get install -y jq
    elif [[ "$PACKAGE_MANAGER" == "yum" ]]; then
        sudo yum install -y jq
    else
        echo "   ⚠️  Please install jq manually: https://jqlang.github.io/jq/"
    fi
    echo "   ✅ jq installed"
fi

# Verify installations
echo ""
echo "🔍 Verifying installations..."
echo ""

verify_tool() {
    local tool=$1
    local name=$2
    if command_exists "$tool"; then
        echo "✅ $name: $(which $tool)"
        if [[ "$tool" == "semgrep" ]]; then
            echo "   Version: $(semgrep --version 2>/dev/null || echo 'version check failed')"
        elif [[ "$tool" == "trufflehog" ]]; then
            echo "   Version: $(trufflehog --version 2>/dev/null || echo 'version check failed')"
        elif [[ "$tool" == "checkov" ]]; then
            echo "   Version: $(checkov --version 2>/dev/null || echo 'version check failed')"
        elif [[ "$tool" == "jq" ]]; then
            echo "   Version: $(jq --version 2>/dev/null || echo 'version check failed')"
        fi
    else
        echo "❌ $name: Not found"
    fi
}

verify_tool "trufflehog" "TruffleHog"
verify_tool "semgrep" "Semgrep"
verify_tool "checkov" "Checkov" 
verify_tool "jq" "jq"

echo ""
echo "🎉 Security tools installation complete!"
echo ""
echo "📋 Next steps:"
echo "   • Run 'make test-security' to test all security tools"
echo "   • Run 'make test-security-sast' to test SAST only"
echo "   • Run 'make test-security-secrets' to test secret scanning"
echo ""
echo "💡 All tools are now installed and ready for local security testing!"