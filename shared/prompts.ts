export const STYLE_PROMPTS: Record<string, string> = {
  Corporate: 'Professional corporate headshot of an attractive TOK ${person} with a clean background and formal business attire. Well-groomed appearance, confident pose.',
  Casual: 'Relaxed and friendly headshot of an attractive TOK ${person} with casual smart clothing and a soft background. Natural and approachable expression.',
  Artistic: 'Create an artistic portrait of a TOK ${person} in a dramatic, painterly style. The subject is looking slightly off-camera, with soft, diffused lighting emphasizing facial features and emotional depth. Use rich, textured brushstrokes, a muted color palette with warm undertones, and a softly blurred background that suggests depth without distraction. The overall tone should evoke introspection and timelessness, reminiscent of a classical oil painting.',
  Outdoor: 'Natural headshot of an outdoorsy TOK ${person} taken in nature with natural lighting and greenery. Professional yet approachable.',
  Fantasy: 'Epic portrait of a TOK ${person} in a fantasy setting. The overall atmosphere is mysterious and dramatic, in the visual style of Dungeons & Dragons, Lord of the Rings, and Game of Thrones. Ultra-realistic, high detail, dark fantasy color palette, 4K resolution.'
};

export function getStylePrompt(
  style: string,
  gender: 'male' | 'female',
  additionalPrompt?: string
): string {
  const person = gender === 'male' ? 'man' : 'woman';
  const basePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.Corporate;
  // Replace ${person} placeholder with actual gender
  const stylePrompt = basePrompt.replace('${person}', person);
  return `${stylePrompt}${additionalPrompt ? ` Additional details: ${additionalPrompt}` : ''}`;
}
