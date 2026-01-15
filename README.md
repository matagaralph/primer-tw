# @primer/next-tw

A professional, streamlined starter template for building high-performance web applications using **Primer Design System**, **Tailwind CSS**, and **Next.js**.

This template is designed for developers who appreciate the structural integrity of a mature design system but prefer to avoid the dependency overhead associated with "copy-paste" UI libraries like shadcn/ui. By using Primer as the foundation, you inherit a robust design language while maintaining the utility-first speed of Tailwind CSS.

## Key Features

- Built on GitHub's official design tokens and aesthetic.
- Leverages a centralized design system rather than multiplying components in your local directory.
- Pre-configured with **TanStack Query** for enterprise-grade state management and data fetching.
- Custom configurations to bridge Primer CSS variables with Tailwind utility classes.

## Styling

The template maps Primer’s functional design tokens to Tailwind utilities. This allows for a seamless development experience using both predefined shorthands and native CSS variable syntax.

### Custom Shorthands

Commonly used tokens are mapped directly:

- `text-default` → `--fgColor-default`
- `bg-default` → `--bgColor-default`

### Arbitrary Value Syntax

For tokens not explicitly mapped in the config, use Tailwind's support for CSS variables:

- `text-(--fgColor-accent)`
- `bg-(--bgColor-muted)`
- `border-(--borderColor-default)`

## Customisation

You can customize the look and feel to align with your brand by overriding Primer UI CSS variables in your global stylesheet.

```css
:root {
  --fgColor-accent: #your-brand-color;
  --bgColor-default: #your-custom-bg;
}
```

## Learn more

To learn more about the technologies used in this template, see the following resources:

- [Tailwind CSS](https://tailwindcss.com/docs) - the official Tailwind CSS documentation
- [Next.js](https://nextjs.org/docs) - the official Next.js documentation
- [Primer UI](https://primer.style) - the official Motion One documentation
