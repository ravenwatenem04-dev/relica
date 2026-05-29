import SwiftUI

@main
struct MulticaConsoleApp: App {
    @StateObject private var authManager: AuthManager
    @State private var authViewModel: AuthViewModel

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
                case .authenticated(let user):
                    mainTabView(user: user)
                case .unauthenticated:
                    LoginView(viewModel: authViewModel)
                }
            }
        }
    }

    @ViewBuilder
    private func mainTabView(user: User) -> some View {
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
                SettingsView(user: user, authViewModel: authViewModel)
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape")
            }
        }
        .environmentObject(authManager)
    }
}
