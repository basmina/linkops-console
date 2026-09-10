import { Link } from './link';

export interface LinkRepository {
  findAll(): Promise<Link[]>;
  findById(id: string): Promise<Link | undefined>;
  create(link: Link): Promise<Link>;
  update(link: Link): Promise<Link>;
  delete(id: string): Promise<void>;
}
