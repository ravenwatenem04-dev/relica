// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MulticaConsole",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "MulticaConsole",
            targets: ["MulticaConsole"]
        ),
    ],
    targets: [
        .target(
            name: "MulticaConsole",
            path: "MulticaConsole"
        ),
    ]
)
