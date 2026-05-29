import SwiftUI

struct SettingsView: View {
    @State private var apiToken = ""
    @State private var serverURL = "http://localhost:3001"
    @State private var isLoggingIn = false
    @State private var error: String?
    @State private var isLoggedIn = false
    @State private var user: User?

    var body: some View {
        NavigationStack {
            Form {
                if isLoggedIn {
                    userSection
                    serverSection
                    actionsSection
                } else {
                    loginSection
                    serverSection
                }

                Section("About") {
                    LabeledContent("Version", value: "1.0.0")
                    LabeledContent("Platform", value: "Multica Console")
                }
            }
            .navigationTitle("Settings")
            .task {
                await checkLoginStatus()
            }
        }
    }

    private var loginSection: some View {
        Section("API Token") {
            SecureField("Enter your Multica API token", text: $apiToken)
                .textContentType(.password)
                .autocapitalization(.none)
                .disableAutocorrection(true)

            if let error {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
            }

            Button {
                Task { await login() }
            } label: {
                if isLoggingIn {
                    HStack {
                        ProgressView()
                            .scaleEffect(0.8)
                        Text("Connecting...")
                    }
                } else {
                    Text("Connect")
                        .fontWeight(.semibold)
                }
            }
            .disabled(apiToken.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isLoggingIn)
            .frame(maxWidth: .infinity, alignment: .center)
        } header: {
            Text("Sign In")
        } footer: {
            Text("Your API token is stored securely on device and never shared.")
        }
    }

    private var serverSection: some View {
        Section("Server") {
            TextField("Server URL", text: $serverURL)
                .textContentType(.URL)
                .autocapitalization(.none)
                .disableAutocorrection(true)
                .keyboardType(.URL)
                .disabled(isLoggedIn)
        }
    }

    private var userSection: some View {
        Section("Account") {
            if let user {
                LabeledContent("Name", value: user.displayName ?? user.name ?? user.email ?? "Unknown")
                LabeledContent("ID", value: user.id)
            }
            LabeledContent("Status", value: "Connected")
                .foregroundColor(.green)
        }
    }

    private var actionsSection: some View {
        Section {
            Button(role: .destructive) {
                Task { await logout() }
            } label: {
                HStack {
                    Spacer()
                    Text("Disconnect")
                    Spacer()
                }
            }
        }
    }

    private func login() async {
        isLoggingIn = true
        error = nil

        let trimmedToken = apiToken.trimmingCharacters(in: .whitespacesAndNewlines)
        await APIClient.shared.configure(baseURL: serverURL, token: trimmedToken)

        do {
            let me = try await APIClient.shared.me()
            user = me
            isLoggedIn = true
            apiToken = ""
        } catch {
            await APIClient.shared.clearToken()
            self.error = "Failed to connect: \(error.localizedDescription)"
        }

        isLoggingIn = false
    }

    private func logout() async {
        await APIClient.shared.logout()
        isLoggedIn = false
        user = nil
        serverURL = "http://localhost:3001"
    }

    private func checkLoginStatus() async {
        if await APIClient.shared.isLoggedIn() {
            do {
                let me = try await APIClient.shared.me()
                user = me
                isLoggedIn = true
            } catch {
                await APIClient.shared.clearToken()
            }
        }
    }
}
