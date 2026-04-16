import { Link } from 'react-router-dom'
import { useAsciiMutation } from '../hooks/useAsciiMutation'
import { useTypedRotatingText } from '../hooks/useTypedRotatingText'

const subtitles = [
  'Кажется, эта страница потерялась.',
  'Но твой путь все еще можно найти.',
  'Вернемся туда, где все начинается.',
  'Иногда даже ошибка 404 - часть маршрута.',
  'Страница не найдена, но направление есть.',
] as const

const asciiLogo = String.raw`
@@@      @@@        @@@@@        @@    @@
@@@      @@@       @@@ @@@        @@  @@
@@@  @@  @@@      @@@   @@@        @@@@
@@@ @@@@ @@@     @@@@@@@@@@@        @@
@@@@    @@@@    @@@       @@@       @@
@@@      @@@   @@@         @@@      @@
@@@      @@@  @@@           @@@     @@
`

export function NotFoundPage() {
  const subtitle = useTypedRotatingText(subtitles)
  const animatedLogo = useAsciiMutation(asciiLogo)

  return (
    <main className="not-found-page" aria-labelledby="not-found-title">
      <div className="not-found-page__ambient" aria-hidden="true" />
      <div className="not-found-page__content">
        <section className="not-found-page__copy">
          <p className="not-found-page__eyebrow">W.A.Y. / route missing</p>
          <h1 id="not-found-title">404...</h1>
          <p className="not-found-page__subtitle" aria-live="polite">
            <span>{subtitle}</span>
            <span className="not-found-page__cursor" aria-hidden="true" />
          </p>
          <Link className="not-found-page__button" to="/">
            Вернуться домой
          </Link>
        </section>

        <section className="not-found-page__logo" aria-label="W.A.Y.">
          <pre>{animatedLogo}</pre>
        </section>
      </div>
    </main>
  )
}
