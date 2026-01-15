plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    id("com.facebook.react")
}

react {
    autolinkLibrariesWithApp()
}

android {
    namespace = "com.netscan"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.netscan"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        debug {
            isDebuggable = true
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.activity)

    // React Native
    implementation("com.facebook.react:react-android")
    implementation("com.facebook.react:hermes-android")
}
