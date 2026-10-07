import type { ReactNode } from 'react'

type BackgroundSceneProps = {
  children: ReactNode
}

const towers = Array.from({ length: 9 })

export default function BackgroundScene({ children }: BackgroundSceneProps) {
  return (
    <section className="scene">
      <div className="industrial-line">
        {towers.map((_, index) => (
          <span key={index} />
        ))}
      </div>
      <div className="industrial-base" />
      {children}
    </section>
  )
}
