/** Emblème du barillet en version statique (mode éco) : dégradé laiton découpé par le SVG — zéro WebGL, zéro animation. */
export function StaticEmblem({ size = 84 }: { size?: number }) {
  const mask = `url(${import.meta.env.BASE_URL}img/emblem.svg) center / contain no-repeat`
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at 35% 30%, #fff1c2 0%, #e9b95a 28%, #a8741f 62%, #5a3a0c 100%)',
        WebkitMask: mask,
        mask,
        filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.6))',
      }}
    />
  )
}
