import { skillGroups } from '../data/profile';
import { Reveal } from './Reveal';

export function SkillsGrid() {
  return (
    <ul className="skills" role="list">
      {skillGroups.map((group, index) => (
        <Reveal as="li" key={group.id} className="skill-card" delay={(index % 3) * 0.06} from="scale">
          <h3 className="skill-card__title">{group.title}</h3>
          <ul className="skill-card__chips" role="list">
            {group.items.map((item) => (
              <li key={item} className="skill-chip" dir="ltr">
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      ))}
    </ul>
  );
}
