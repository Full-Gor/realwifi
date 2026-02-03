#!/bin/bash
# Patch React Native gradle-plugin settings to include version catalog

PLUGIN_SETTINGS="node_modules/@react-native/gradle-plugin/settings.gradle.kts"

if [ -f "$PLUGIN_SETTINGS" ]; then
    # Add dependencyResolutionManagement if not present
    if ! grep -q "dependencyResolutionManagement" "$PLUGIN_SETTINGS"; then
        cat >> "$PLUGIN_SETTINGS" << 'EOF'

dependencyResolutionManagement {
    versionCatalogs {
        create("libs") {
            from(files("gradle/libs.versions.toml"))
        }
    }
}
EOF
        echo "Patched $PLUGIN_SETTINGS"
    fi
fi
