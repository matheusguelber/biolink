/**
 * Full Discord Animated Avatar Decorations Master Catalog (200+ Official Discord Decorations)
 */

const rawDecorationsList = [
  "im_a_clown", "mokoko", "sakura_gyoiko", "warp_helmet", "victory_crown", 
  "freezer_bunny_lovebug", "wingman_boba", "los_santos", "hailey", "bunny", 
  "torgal_puppy", "street_fighter_6_battle_field", "wolf_morph", "wallach_spaceport", 
  "batarang", "rift_butterfly", "bush_camper", "shield_potion", "tga_controller", 
  "shadow", "new_year_2025", "santa_cat_ears", "snowfall", "rec_room_lightning", 
  "wingmans_got_it", "jeff_the_land_shark", "fuchsia_agent", "heart_to_heart", 
  "snakes_hug", "lotus_flower", "red_lantern", "fan_flourish", "lunar_lanterns", 
  "firecrackers", "dragons_smile", "lucky_envelopes", "koi_pond", "steampunk_cat_ears", 
  "mech_flora", "bowler_hat", "brass_beats", "timekeepers_clock", "flux_alchemy", 
  "magic_portal_purple", "magic_portal_blue", "fairy_sprites_pink", "fairy_sprites_blue", 
  "fairy_sprites", "crystal_ball_purple", "crystal_ball_blue", "wizard_hat_purple", 
  "wizard_hat_blue", "magical_wand_purple", "magical_wand_green", "mooncaps_pink", 
  "mooncaps_blue", "cottage_home", "flaming_sword", "magical_potion", "wizards_staff", 
  "glowing_runes", "defensive_shield", "skull_medallion", "treasure_and_key", 
  "aurora", "polar_bear_hat", "string_lights", "string_lights_aurora", "string_lights_ember", 
  "string_lights_dusk", "string_lights_mix", "snowglobe", "snowglobe_wood", "snowglobe_pink", 
  "snowglobe_blue", "snowglobe_green", "fresh_pine", "fresh_pine_cinnamon", "fresh_pine_ribbon", 
  "lofi_girl_outfit", "playful_lofi_cat", "sleepy_chilledcow", "study_session", 
  "group_hug", "cozy_post_it", "cozy_post_it_festive", "cat_ear_headset", "bubble_tea", 
  "bunny_zzzs", "sproutling", "bloomling", "neon_nibbles", "uwu_xp", "hex_lights", 
  "the_anomaly", "the_mark", "the_monster_you_created", "the_atlas_gauntlets", 
  "flame_chompers", "fishbones", "the_hexcore", "powered_by_shimmer", "kitsune", 
  "unicorn", "phoenix", "dancing_fairies", "crystal_elk", "mermaid_serenade", 
  "dice_violet", "dice_azure", "gelatinous_cube_green", "gelatinous_cube_blue", 
  "owlbear_cub", "owlbear_cub_snowy", "baby_displacer_beast", "spooky_cat_ears", 
  "spooky_cat_ears_midnight", "candlelight", "candlelight_crimson", "candlelight_dark", 
  "hood_dark", "hood_crimson", "witch_hat_plum", "witch_hat_midnight", "zombie_food", 
  "zombie_food_purple", "bloodthirsty", "bloodthirsty_green", "bloodthirsty_gold", 
  "ryu", "chun_li", "ken", "akuma", "cammy", "guile", "juri", "m_bison", 
  "chrysanthemums_twilight", "chrysanthemums_morning", "dusk_and_dawn", "floral_harmony", 
  "floral_harmony_sunburst", "autumns_arbor", "autumns_arbor_aurora", "autumn_crown", 
  "faces_of_the_moon", "fox_hat", "fox_hat_chestnut", "fox_hat_snow", "fall_leaves", 
  "fall_leaves_scarlet", "fall_leaves_woodland", "sakura", "sakura_pink", "sakura_ukon", 
  "frog_angry", "frog_derpy", "fried_egg", "green_fried_egg", "morning_coffee", 
  "toast", "burnt_toast", "stinkums", "goblin_stinkums", "kabuto", "oni_mask", 
  "straw_hat", "sakura_ink", "sakura_warrior", "shurikens_mask", "valorant_champions_2024", 
  "yoru_dimensional_drift", "viper_poison_cloud", "cypher_neural_theft", "a_hint_of_clove", 
  "omens_cowl", "reynas_leer", "frag_out", "blade_storm", "spongebob", "imagination", 
  "patrick_star", "flower_clouds", "gary_the_snail", "sandy_cheeks", "musclebob", 
  "midnight_sorceress", "malefic_crown", "deaths_edge", "spirit_embers", "eldritch_ring", 
  "arcane_sigil", "chillet", "pal_sphere", "cattiva", "lamball", "depresso", 
  "selyne", "joystick", "clyde_invaders", "pipedream", "hot_shot", "mallow_jump", 
  "slither_n_snack", "feelin_awe", "feelin_panic", "feelin_nervous", "feelin_scrumptious", 
  "pirate_captain", "scallywag", "good_ol_pepper", "crossbones", "cannon_fire", "helmsman",
  "stardust", "black_hole", "constellations", "solar_orbit", "ufo", "astronaut_helmet",
  "chromawave", "cozy_cat", "oasis", "rainy_mood", "cozy_headphones", "doodling",
  "honeyblossom", "dandelion_duo", "hugh_the_rainbow", "strawberry_vine", "butterflies",
  "the_petal_pack", "cat_ears", "ki_energy", "heartbloom", "dismay", "rage", "in_tears",
  "radiating_energy", "soul_leaving_body", "sweat_drops", "starry_eyed", "in_love",
  "shocked", "angry", "fire", "water", "air", "earth", "lightning", "balance", "glitch",
  "cybernetic", "digital_sunrise", "implant", "beamchop", "chuck", "winkle", "chewbert",
  "doodlezard", "glop", "gawblehop", "new_year_2024", "graveyard_cat", "ghosts", "minions",
  "jack_o_lantern", "pumpkin_spice", "frog_hat", "blueberry_jam", "donut", "pancakes",
  "disxcore_headset", "pink_futuristic_ui", "green_smoke", "pink_headset", "green_headset",
  "blue_futuristic_ui", "green_futuristic_ui", "blue_smoke", "pink_smoke", "blue_gyroscope",
  "pink_gyroscope", "green_gyroscope", "blue_shine_helmet", "pink_shine_helmet",
  "green_shine_helmet", "blue_hyper_helmet", "pink_hyper_helmet", "green_hyper_helmet",
  "saw", "mushroom_1", "mushroom_2", "mushroom_3", "mushroom_4", "forest", "frog_1",
  "frog_3", "cat_1", "cat_2", "cat_3", "cat_4", "dog_1", "dog_2", "dog_3",
  "blanket_green", "blanket_orange", "blanket_pink", "blanket_purple", "box_white_blue",
  "box_blue_yellow", "box_green_red", "box_red_white", "box_red_white_blue",
  "confetti_festive", "confetti_fire", "confetti_ice", "confetti_mint", "confetti_star",
  "confetti_vaporwave", "ice_cube", "icicle_gleaming", "icicle_snowing", "teacup_blue",
  "teacup_orange", "teacup_pink", "teacup_red"
];

// Deduplicate IDs
const uniqueSlugs = Array.from(new Set(rawDecorationsList));

function formatName(slug) {
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

export const AVATAR_DECORATIONS = [
  {
    id: "deco-water-feds",
    name: "Cosmic Water Splash",
    category: "Discord Oficial",
    imgUrl: "https://feds.lol/decorations/water.png",
    description: "Moldura clássica de respingos cósmicos"
  },
  ...uniqueSlugs.map(item => ({
    id: `deco-${item}`,
    name: formatName(item),
    category: "Discord Oficial",
    imgUrl: `https://img.avatardecoration.com/decorations/${item}.png`,
    description: `Moldura oficial do Discord (${formatName(item)})`
  })),
  {
    id: "none",
    name: "Nenhuma Moldura",
    category: "Básico",
    imgUrl: "",
    description: "Avatar limpo sem decoração"
  }
];

export function getDecorationById(id, customUrl = '') {
  if (id === 'custom' && customUrl) {
    return {
      id: 'custom',
      name: 'Moldura Personalizada',
      category: 'Custom',
      imgUrl: customUrl,
      description: 'Moldura importada via URL direta'
    };
  }
  return AVATAR_DECORATIONS.find(d => d.id === id) || AVATAR_DECORATIONS[0];
}
