import { Injectable } from "@angular/core";
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, GuardResult } from "@angular/router";
import { UtilityService } from "../services/utility.service";

@Injectable({
  providedIn: "root"
})
export class EnsureUserGuard implements CanActivate
{
  constructor(public util: UtilityService)
  {
    
  }
  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<GuardResult>
  {
    
    let user = await this.util.ensureUser();
    return user != null ? true : false;
  }
  
}