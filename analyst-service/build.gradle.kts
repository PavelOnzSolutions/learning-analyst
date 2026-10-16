plugins {
    `version-catalog`
    id("solutions.onz.gradle.spring-boot-mvc-conventions")
}

version = "1.0.0"
description = "analyst-service"


configurations {
    compileOnly {
        extendsFrom(configurations.annotationProcessor.get())
    }
}

repositories {
    mavenCentral()
}


val springProfilesActive = mutableListOf<String>()

springProfilesActive +=
    if (project.hasProperty("local")) {
        "local"
    } else {
        "azure"
    }

tasks.named<JavaExec>("bootRun") {
    args = listOf("--spring.profiles.active=${springProfilesActive.joinToString(",")}")
}

dependencies {
    // Database
    implementation("org.springframework.boot:spring-boot-starter-data-mongodb")
    implementation("com.jayway.jsonpath:json-path:2.9.0")

    // Swagger
    implementation(libs.bundles.springdoc.webmvc) {
        constraints {
            implementation("org.apache.commons:commons-lang3:3.18.0") {
                because("Mitigate CVE-2025-48924")
            }
        }
    }

    // Document parsing
    implementation("org.apache.tika:tika-core:4.0.0")
    implementation("org.apache.tika:tika-parsers-standard-package:4.0.0")
    implementation("org.jsoup:jsoup:1.23.2")

    // Markdown → HTML (used when API clients request htmlOutput=true)
    implementation("org.commonmark:commonmark:0.24.0")

    // Observability
    runtimeOnly("io.micrometer:micrometer-registry-otlp")

    // Dev
    developmentOnly("org.springframework.boot:spring-boot-docker-compose")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-security-test")

}

dependencyManagement {
    imports {
        mavenBom("io.mongock:mongock-bom:5.5.1")
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}

val dockerImageName = "demon/${project.name}:${project.version}"

tasks.register<Exec>("dockerBuildImage") {
    group = "docker"
    description = "Build the ${project.name} Docker image."
    workingDir = rootDir
    commandLine(
        "docker",
        "build",
        "-f",
        "${projectDir.relativeTo(rootDir).invariantSeparatorsPath}/Dockerfile",
        "-t",
        dockerImageName,
        ".",
    )
}
