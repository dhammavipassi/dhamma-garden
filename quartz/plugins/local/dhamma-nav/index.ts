import { QuartzComponent, QuartzComponentConstructor } from "../../../components/types"

const DhammaNav: QuartzComponent = () => {
  return (
    <nav class="dhamma-nav">
      <ul>
        <li>
          <a href="./佛法修学" class="nav-item">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2C8 6 6 10 6 14a6 6 0 0 0 12 0c0-4-2-8-6-12z" />
              <path d="M12 6v8" />
            </svg>
            <span class="nav-label">佛法修学</span>
          </a>
        </li>
        <li>
          <a href="./AI实践" class="nav-item">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="6" width="16" height="12" rx="2" />
              <path d="M8 10h8M8 14h5" />
              <circle cx="17" cy="14" r="0.5" fill="currentColor" />
            </svg>
            <span class="nav-label">AI 实践</span>
          </a>
        </li>
        <li>
          <a href="./关于" class="nav-item">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span class="nav-label">关于</span>
          </a>
        </li>
      </ul>
    </nav>
  )
}

DhammaNav.css = `
.dhamma-nav {
  margin-top: 1.5rem;
  padding: 0;
}
.dhamma-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.dhamma-nav .nav-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
  font-weight: 400;
  font-size: 0.95rem;
  color: var(--darkgray);
  text-decoration: none;
  background: transparent;
  transition: background 0.2s ease, color 0.2s ease;
  line-height: 1.4;
}
.dhamma-nav .nav-item:hover {
  background: var(--highlight);
  color: var(--tertiary);
}
.dhamma-nav .nav-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  opacity: 0.7;
}
.dhamma-nav .nav-item:hover .nav-icon {
  opacity: 1;
}
`

export default (() => DhammaNav) satisfies QuartzComponentConstructor
