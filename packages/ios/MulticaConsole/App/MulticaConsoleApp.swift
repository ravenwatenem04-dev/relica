import SwiftUI

@main
struct MulticaConsoleApp: App {
    @StateObject private var authManager: AuthManager
    @State private var authViewModel: AuthViewModel

    private var apiClient: APIClient {
        APIClient(authManager: authManager)
    }

    init() {
        let authManager = AuthManager()
        _authManager = StateObject(wrappedValue: authManager)
        _authViewModel = State(initialValue: AuthViewModel(authManager: authManager))
    }

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

    private var mainTabView: some View {
        TabView {
            TodayView(apiClient: apiClient)
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
                SettingsView(apiClient: apiClient, authViewModel: authViewModel)
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape")
            }
        }
        .environmentObject(authManager)
    }
}
