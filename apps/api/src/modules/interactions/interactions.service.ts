import { MediaInteractionService } from "../media-interactions/services/media-interaction.service";
import { filmInteraction } from "./services/film-interaction.adapter";
import type { UpdateInteractionDto } from "./dto/interactions.dto";

// A Film's Interaction. The write rules live in MediaInteractionService.
export class InteractionsService {
  static async get(userId: string, tmdbId: number) {
    return MediaInteractionService.get(filmInteraction, userId, tmdbId);
  }

  static async update(userId: string, tmdbId: number, input: UpdateInteractionDto) {
    return MediaInteractionService.update(filmInteraction, userId, tmdbId, input);
  }
}
