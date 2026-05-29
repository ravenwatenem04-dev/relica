import Foundation

@MainActor
final class AuthManager: ObservableObject {
    @Published private(set) var token: String?

    private let keychainService = "ai.multica.console"
    private let tokenAccount = "authToken"

    init() {
        token = KeychainHelper.read(service: keychainService, account: tokenAccount)
    }

    func setToken(_ token: String) {
        self.token = token
        KeychainHelper.write(token, service: keychainService, account: tokenAccount)
    }

    func clearToken() {
        token = nil
        KeychainHelper.delete(service: keychainService, account: tokenAccount)
    }
}
