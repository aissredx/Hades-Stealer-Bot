import { EMOJIS } from "../config";

export function getBadges(profile: any): string[] {
  const out: string[] = [];

  if (Array.isArray(profile.badges)) {
    for (const badge of profile.badges) {
      switch (badge.id) {
        case "partner": out.push(EMOJIS.Partner); break;
        case "certified_moderator": out.push(EMOJIS.Moderator); break;
        case "hypesquad": out.push(EMOJIS.HypesquadEvents); break;
        case "hypesquad_house_1": out.push(EMOJIS.Bravery); break;
        case "hypesquad_house_2": out.push(EMOJIS.Brilliance); break;
        case "hypesquad_house_3": out.push(EMOJIS.Balance); break;
        case "bug_hunter_level_1": out.push(EMOJIS.BugHunter1); break;
        case "bug_hunter_level_2": out.push(EMOJIS.BugHunter2); break;
        case "verified_developer": out.push(EMOJIS.BotDeveloper); break;
        case "early_supporter": out.push(EMOJIS.EarlySupporter); break;
        case "quest_completed": out.push(EMOJIS.Gorev); break;
        case "orb_profile_badge": out.push(EMOJIS.Orbs); break;

        case "premium_tenure_1_month":
        case "premium_tenure_1_month_v2": out.push(EMOJIS.Bronz); break;
        case "premium_tenure_3_month":
        case "premium_tenure_3_month_v2": out.push(EMOJIS.Gumus); break;
        case "premium_tenure_6_month":
        case "premium_tenure_6_month_v2": out.push(EMOJIS.Altin); break;
        case "premium_tenure_12_month":
        case "premium_tenure_12_month_v2": out.push(EMOJIS.Platin); break;
        case "premium_tenure_24_month":
        case "premium_tenure_24_month_v2": out.push(EMOJIS.Elmas); break;
        case "premium_tenure_36_month":
        case "premium_tenure_36_month_v2": out.push(EMOJIS.Zumrut); break;
        case "premium_tenure_60_month":
        case "premium_tenure_60_month_v2": out.push(EMOJIS.Yakut); break;
        case "premium_tenure_72_month":
        case "premium_tenure_72_month_v2": out.push(EMOJIS.Opal); break;

        case "guild_booster_lvl1": out.push(EMOJIS.Booster_1ay); break;
        case "guild_booster_lvl2": out.push(EMOJIS.Booster_2ay); break;
        case "guild_booster_lvl3": out.push(EMOJIS.Booster_3ay); break;
        case "guild_booster_lvl4": out.push(EMOJIS.Booster_6ay); break;
        case "guild_booster_lvl5": out.push(EMOJIS.Booster_9ay); break;
        case "guild_booster_lvl6": out.push(EMOJIS.Booster_12ay); break;
        case "guild_booster_lvl7": out.push(EMOJIS.Booster_15ay); break;
        case "guild_booster_lvl8": out.push(EMOJIS.Booster_18ay); break;
        case "guild_booster_lvl9": out.push(EMOJIS.Booster_24ay); break;

      }
    }
  }

  return out;
}