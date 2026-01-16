import { Logger } from "./logger";

/**
 * Gère les erreurs du bot et retourne un message d'erreur formaté avec des conseils
 */
export class ErrorHandler {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Traite une erreur et retourne un message formaté avec des conseils
   */
  handleError(err: Error & { code?: string }): void {
    let errorMessage = "❌ Erreur du bot: " + err.message;
    let advice = "";

    // Gestion des erreurs courantes avec conseils
    if (err.code === "ECONNRESET") {
      errorMessage = "❌ Connexion réinitialisée par le serveur";
      advice =
        "\n💡 Conseils:\n" +
        "- Vérifiez que le serveur est en ligne et accessible\n" +
        "- Vérifiez que le port est correct\n" +
        "- Le serveur peut avoir rejeté la connexion (whitelist, bannissement)\n" +
        "- Vérifiez votre connexion internet";
    } else if (err.code === "ETIMEDOUT" || err.code === "ENOTFOUND") {
      errorMessage = "❌ Impossible de se connecter au serveur";
      advice =
        "\n💡 Conseils:\n" +
        "- Vérifiez l'adresse du serveur (host)\n" +
        "- Vérifiez que le serveur est accessible depuis votre réseau\n" +
        "- Vérifiez votre connexion internet";
    } else if (err.code === "ECONNREFUSED") {
      errorMessage = "❌ Connexion refusée par le serveur";
      advice =
        "\n💡 Conseils:\n" +
        "- Le serveur n'accepte peut-être pas de nouvelles connexions\n" +
        "- Vérifiez que le port est correct\n" +
        "- Le serveur peut être en maintenance";
    } else if (err.message && err.message.includes("Invalid session")) {
      errorMessage = "❌ Session invalide";
      advice =
        "\n💡 Conseils:\n" +
        "- Vérifiez vos identifiants Microsoft si vous utilisez l'authentification Microsoft\n" +
        "- Réessayez de vous connecter";
    }

    this.logger.log(errorMessage + advice);
  }
}

