import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  FleetSummary,
  Link,
  LinkConfig,
  TelemetrySample,
  TelemetryWindow,
} from '@linkops-console/link';

export type CreateLinkRequest = LinkConfig;

export type UpdateLinkRequest = LinkConfig & { version: number };

@Injectable({
  providedIn: 'root',
})
export class FleetApiService {
  private readonly http = inject(HttpClient);

  getLinks(): Observable<Link[]> {
    return this.http.get<Link[]>('/api/links');
  }

  getLink(id: string): Observable<Link> {
    return this.http.get<Link>(`/api/links/${id}`);
  }

  getSummary(): Observable<FleetSummary> {
    return this.http.get<FleetSummary>('/api/fleet/summary');
  }

  getTelemetry(
    id: string,
    window: TelemetryWindow = '5m',
  ): Observable<TelemetrySample[]> {
    return this.http.get<TelemetrySample[]>(
      `/api/links/${id}/telemetry?window=${window}`,
    );
  }

  createLink(request: CreateLinkRequest): Observable<Link> {
    return this.http.post<Link>('/api/links', request);
  }

  updateLink(id: string, request: UpdateLinkRequest): Observable<Link> {
    return this.http.patch<Link>(`/api/links/${id}`, request);
  }

  deleteLink(id: string): Observable<void> {
    return this.http.delete<void>(`/api/links/${id}`);
  }
}
