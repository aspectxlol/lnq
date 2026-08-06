import { Injectable } from "@nestjs/common";

import { DrizzleService } from "../../db/drizzle.service";



@Injectable()
export class ProductRepository {
  constructor(private readonly drizzle: DrizzleService) {}
}
