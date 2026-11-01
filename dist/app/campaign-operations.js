/** Application-level reference cleanup across optional features. */
export function removeCharacter(campaign, id) {
  campaign.characters = campaign.characters.filter(c=>c.id!==id);
  for (const chapter of campaign.chapters) chapter.characterIds = chapter.characterIds.filter(v=>v!==id);
  campaign.tournament.matches = campaign.tournament.matches.filter(m=>m.a!==id && m.b!==id);
}
