import SwiftUI

@main
struct MulticaConsoleApp: App {
    @StateObject private var authManager = AuthManager()
    private var apiClient: APIClient {
        APIClient(authManager: authManager)
    }

    var body: some Scene {
        WindowGroup {
            TabView {
                NavigationStack {
                    Text("Today")
                        .navigationTitle("Today")
                }
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
                    AgentListView(apiClient: apiClient)
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
