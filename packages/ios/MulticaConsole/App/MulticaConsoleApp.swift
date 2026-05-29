import SwiftUI

@main
struct MulticaConsoleApp: App {
    @StateObject private var authManager = AuthManager()
    @State private var authViewModel = AuthViewModel(authManager: authManager)

    var body: some Scene {
        WindowGroup {
            Group {
                switch authViewModel.authState {
                case .loading:
                    ProgressView("Signing in...")
                        .task {
                            await authViewModel.checkAuthentication()
                        }
                case .authenticated:
                    mainTabView
                case .unauthenticated:
                    LoginView(viewModel: authViewModel)
                }
            }
        }
    }

    @ViewBuilder
    private var mainTabView: some View {
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
