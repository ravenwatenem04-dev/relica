import SwiftUI

struct LoginView: View {
    let viewModel: AuthViewModel

    @State private var token = ""
    @State private var isLoggingIn = false

    var body: some View {
        VStack(spacing: 16) {
            Spacer()

            Image(systemName: "key.fill")
                .font(.system(size: 48))
                .foregroundStyle(.tint)

            Text("Multica Console")
                .font(.largeTitle)
                .bold()

            Text("Enter your API token to sign in")
                .foregroundStyle(.secondary)

            SecureField("API Token", text: $token)
                .textFieldStyle(.roundedBorder)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .padding(.horizontal, 24)

            Button {
                signIn()
            } label: {
                if isLoggingIn {
                    ProgressView()
                } else {
                    Text("Sign In")
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(token.isEmpty || isLoggingIn)
            .padding(.horizontal, 24)

            if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
                    .foregroundStyle(.red)
                    .font(.caption)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
            }

            Spacer()
        }
        .task {
            await viewModel.checkAuthentication()
        }
    }

    private func signIn() {
        isLoggingIn = true

        Task {
            await viewModel.login(token: token)
            isLoggingIn = false
        }
    }
}
