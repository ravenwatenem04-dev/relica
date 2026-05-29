import SwiftUI

struct SettingsView: View {
    let user: User
    let authViewModel: AuthViewModel

    @EnvironmentObject private var authManager: AuthManager
    @Environment(\.openURL) private var openURL
    @State private var displayedUser: User
    @State private var connectionState: ConnectionState = .checking
    @State private var isSigningOut = false

    private var apiClient: APIClient {
        APIClient(authManager: authManager)
    }

    init(user: User, authViewModel: AuthViewModel) {
        self.user = user
        self.authViewModel = authViewModel
        _displayedUser = State(initialValue: user)
    }

    var body: some View {
        List {
            Section("User Info") {
                HStack(spacing: 16) {
                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 52))
                        .foregroundStyle(.secondary)
                        .accessibilityHidden(true)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(displayName)
                            .font(.headline)
                        Text(displayEmail)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 8)
            }

            Section("Connection") {
                HStack {
                    Text("API Status")
                    Spacer()
                    HStack(spacing: 8) {
                        Circle()
                            .fill(connectionState.color)
                            .frame(width: 10, height: 10)
                        Text(connectionState.title)
                    }

                    if connectionState == .checking {
                        ProgressView()
                    }
                }

                LabeledContent("API Base URL", value: apiClient.baseURLDisplayString)

                Button {
                    openWebApp()
                } label: {
                    Label("Open Web App", systemImage: "safari")
                }
            }

            Section("App Info") {
                LabeledContent("Version", value: appVersion)
            }

            Section {
                Button(role: .destructive) {
                    signOut()
                } label: {
                    HStack {
                        Spacer()
                        if isSigningOut {
                            ProgressView()
                        } else {
                            Text("Sign Out")
                        }
                        Spacer()
                    }
                }
                .disabled(isSigningOut)
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Settings")
        .task {
            await checkConnection()
        }
    }

    private var displayName: String {
        let value = displayedUser.displayName ?? displayedUser.name
        guard let value, !value.isEmpty else {
            return "Multica User"
        }
        return value
    }

    private var displayEmail: String {
        let value = displayedUser.email
        guard let value, !value.isEmpty else {
            return "No email available"
        }
        return value
    }

    private var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
    }

    @MainActor
    private func checkConnection() async {
        connectionState = .checking

        do {
            displayedUser = try await apiClient.me()
            connectionState = .connected
        } catch {
            connectionState = .disconnected
        }
    }

    private func openWebApp() {
        guard let url = URL(string: apiClient.baseURLDisplayString) else {
            return
        }
        openURL(url)
    }

    @MainActor
    private func signOut() {
        isSigningOut = true

        Task {
            await authViewModel.logout()
            isSigningOut = false
        }
    }
}

private enum ConnectionState {
    case checking
    case connected
    case disconnected

    var title: String {
        switch self {
        case .checking:
            return "Checking..."
        case .connected:
            return "Connected"
        case .disconnected:
            return "Disconnected"
        }
    }

    var color: Color {
        switch self {
        case .checking:
            return .secondary
        case .connected:
            return .green
        case .disconnected:
            return .red
        }
    }
}
