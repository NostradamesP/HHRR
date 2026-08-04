import { UserRepository } from "../../ports/UserRepository";

export class LocalStorageUserRepository extends UserRepository {
  subscribe(onNext) {
    onNext([]);
    return () => {};
  }

  async updateRole() {}

  async updateJobTitle() {}

  async remove() {}
}
