import SwiftUI

@main
struct MulticaConsoleApp: App {
    @StateObject private var authManager = AuthManager()

    var body: some Scene {
        WindowGroup {
            TabView {
                TodayView()
                .tabItem {
                    Label("Today", systemImage: "sun.max")
                }

                NavigationStack {
                    Text("Issues")
                        .navigationTitle("Issues")
                }
                .tabItem {
                    Label("Issues", systemImage: "exclamationmark.bubble")
                }

                NavigationStack {
                    Text("Agents")
                        .navigationTitle("Agents")
                }
                .tabItem {
                    Label("Agents", systemImage: "person.2")
                }

                NavigationStack {
                    Text("Usage")
                        .navigationTitle("Usage")
                }
                .tabItem {
                    Label("Usage", systemImage: "chart.bar")
                }

                NavigationStack {
                    Text("Settings")
                        .navigationTitle("Settings")
                }
                .tabItem {
                    Label("Settings", systemImage: "gearshape")
                }
            }
            .environmentObject(authManager)
        }
    }
}
