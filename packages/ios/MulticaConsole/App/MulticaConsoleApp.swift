import SwiftUI

@main
struct MulticaConsoleApp: App {
    @State private var authManager = AuthManager()
    @State private var viewModel: AuthViewModel?

    var body: some Scene {
        WindowGroup {
            Group {
                if let vm = viewModel {
                    AuthFlowView(viewModel: vm, authManager: authManager)
                        .environmentObject(authManager)
                } else {
                    ProgressView()
                        .task {
                            let vm = AuthViewModel(apiClient: APIClient(authManager: authManager), authManager: authManager)
                            viewModel = vm
                            await vm.checkAuth()
                        }
                }
            }
        }
    }
}

private struct AuthFlowView: View {
    @Bindable var viewModel: AuthViewModel
    let authManager: AuthManager

    var body: some View {
        switch viewModel.state {
        case .loading:
            ProgressView()
                .task { await viewModel.checkAuth() }
        case .unauthenticated:
            LoginView(viewModel: viewModel)
        case .authenticated:
            MainTabView(apiClient: APIClient(authManager: authManager))
        }
    }
}

private struct MainTabView: View {
    let apiClient: APIClient

    var body: some View {
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
                Text("Settings")
                    .navigationTitle("Settings")
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape")
            }
        }
    }
}
