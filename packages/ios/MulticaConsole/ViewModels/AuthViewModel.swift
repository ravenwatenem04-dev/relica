import Foundation
import Observation

enum AuthState: Equatable {
    case loading
    case authenticated(User)
    case unauthenticated
}

@Observable
@MainActor
final class AuthViewModel {
    private(set) var state: AuthState = .loading
    private(set) var error: String?

    private let apiClient: APIClient
    private let authManager: AuthManager

    init(apiClient: APIClient, authManager: AuthManager) {
        self.apiClient = apiClient
        self.authManager = authManager
    }

    func checkAuth() async {
        state = .loading
        error = nil

        guard authManager.token != nil else {
            state = .unauthenticated
            return
        }

        do {
            let user = try await apiClient.me()
            state = .authenticated(user)
        } catch APIError.unauthorized {
            await authManager.clearToken()
            state = .unauthenticated
        } catch {
            await authManager.clearToken()
            state = .unauthenticated
        }
    }

    func login(token: String) async {
        state = .loading
        error = nil

        do {
            let user = try await apiClient.login(token: token)
            state = .authenticated(user)
        } catch APIError.unauthorized {
            self.error = "Invalid token. Please check and try again."
            state = .unauthenticated
        } catch let apiErr as APIError {
            if case .networkError(let underlying) = apiErr {
                self.error = underlying.localizedDescription
            } else {
                self.error = "Login failed. Please try again."
            }
            state = .unauthenticated
        } catch {
            self.error = error.localizedDescription
            state = .unauthenticated
        }
    }

    func logout() async {
        do {
            try await apiClient.logout()
        } catch {
            await authManager.clearToken()
        }
        state = .unauthenticated
        error = nil
    }
}
