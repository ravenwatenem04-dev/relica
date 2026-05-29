import SwiftUI

struct SettingsView: View {
    let apiClient: APIClient
    let authViewModel: AuthViewModel

    @State private var user: User?
    @State private var connectionState: ConnectionState = .checking
    @State private var isSigningOut = false

    private var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
    }

    var body: some View {
        List {
            Section("User Info") {
                HStack(spacing: 16) {
                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 54))
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
                .padding(.vertical, 6)
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

                LabeledContent("API Base URL", value: apiClient.apiBaseURL.absoluteString)

                Link(destination: apiClient.apiBaseURL) {
                    Label("Open Web App", systemImage: "safari")
                }

            }

            Section("App Info") {
                LabeledContent("Version", value: appVersion)
            }

            Section {
                Button(role: .destructive) {
                    Task {
                        await signOut()
                    }
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
            await refreshUserAndConnectionStatus()
        }
        .refreshable {
            await refreshUserAndConnectionStatus()
        }
    }

    private var displayName: String {
        let value = user?.displayName ?? user?.name
        guard let value, !value.isEmpty else {
            return "Signed In User"
        }
        return value
    }

    private var displayEmail: String {
        guard let email = user?.email, !email.isEmpty else {
            return "No email available"
        }
        return email
    }

    @MainActor
    private func refreshUserAndConnectionStatus() async {
        connectionState = .checking

        do {
            user = try await apiClient.me()
            connectionState = .connected
        } catch {
            connectionState = .disconnected
        }
    }

    @MainActor
    private func signOut() async {
        isSigningOut = true

        await authViewModel.logout()

        isSigningOut = false
    }
}

#Preview {
    let authManager = AuthManager()

    NavigationStack {
        SettingsView(
            apiClient: APIClient(authManager: authManager),
            authViewModel: AuthViewModel(authManager: authManager)
        )
    }
    .environmentObject(authManager)
}

private enum ConnectionState: Equatable {
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
