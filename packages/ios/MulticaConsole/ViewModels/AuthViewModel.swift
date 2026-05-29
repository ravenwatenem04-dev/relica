import Foundation
import Observation

enum AuthState {
    case loading
    case authenticated(User)
    case unauthenticated
}

@MainActor
@Observable
final class AuthViewModel {
    var authState: AuthState = .loading
    var errorMessage: String?

    private let apiClient: APIClient
    private let authManager: AuthManager

    init(authManager: AuthManager) {
        self.authManager = authManager
        self.apiClient = APIClient(authManager: authManager)
    }

    func checkAuthentication() async {
        guard authManager.token != nil else {
            authState = .unauthenticated
            return
        }

        do {
            let user = try await apiClient.me()
            authState = .authenticated(user)
        } catch APIError.unauthorized {
            authManager.clearToken()
            authState = .unauthenticated
        } catch {
            authState = .unauthenticated
        }
    }

    func login(token: String) async {
        errorMessage = nil

        do {
            let user = try await apiClient.login(token: token)
            authState = .authenticated(user)
        } catch let error as APIError {
            switch error {
            case .unauthorized:
                errorMessage = "Invalid token. Please check your API token and try again."
            case .networkError:
                errorMessage = "Network error. Please check your connection and try again."
            case .notFound, .serverError:
                errorMessage = "Server error. Please try again later."
            }
        } catch {
            errorMessage = "An unexpected error occurred. Please try again."
        }
    }

    func logout() async {
        do {
            try await apiClient.logout()
        } catch {
            authManager.clearToken()
        }

        authState = .unauthenticated
    }
}
