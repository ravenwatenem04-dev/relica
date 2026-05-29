import SwiftUI

@main
struct MulticaConsoleApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct ContentView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            TodayView()
                .tabItem {
                    Label("Today", systemImage: "sun.max")
                }
                .tag(0)

            IssueListView()
                .tabItem {
                    Label("Issues", systemImage: "exclamationmark.bubble")
                }
                .tag(1)

            AgentListView()
                .tabItem {
                    Label("Agents", systemImage: "person.2")
                }
                .tag(2)

            UsageView()
                .tabItem {
                    Label("Usage", systemImage: "chart.bar")
                }
                .tag(3)

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape")
                }
                .tag(4)
        }
    }
}
