import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import request from 'supertest';

describe('LinkOps HTTP API contract', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/links returns seeded links', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/links')
      .expect(200);

    expect(response.body.length).toBeGreaterThanOrEqual(10);

    expect(response.body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        siteA: expect.any(String),
        siteB: expect.any(String),
        capacityMbps: expect.any(Number),
        version: expect.any(Number),
        status: expect.any(String),
      }),
    );
  });

  it('GET /api/links/:id returns a link', async () => {
    const linksResponse = await request(app.getHttpServer())
      .get('/api/links')
      .expect(200);

    const linkId = linksResponse.body[0].id;

    const response = await request(app.getHttpServer())
      .get(`/api/links/${linkId}`)
      .expect(200);

    expect(response.body.id).toBe(linkId);
  });

  it('GET /api/links/:id/telemetry returns telemetry history', async () => {
    const linksResponse = await request(app.getHttpServer())
      .get('/api/links')
      .expect(200);

    const linkId = linksResponse.body[0].id;

    const response = await request(app.getHttpServer())
      .get(`/api/links/${linkId}/telemetry`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    expect(response.body[0]).toEqual(
      expect.objectContaining({
        linkId,
        ts: expect.any(String),
        rssiDbm: expect.any(Number),
        snrDb: expect.any(Number),
        throughputMbps: expect.any(Number),
      }),
    );
  });

  it('GET /api/fleet/summary returns fleet KPIs', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/fleet/summary')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        total: expect.any(Number),
        up: expect.any(Number),
        degraded: expect.any(Number),
        down: expect.any(Number),
        avgThroughputMbps: expect.any(Number),
      }),
    );
  });

  it('rejects invalid link creation with 400', async () => {
    await request(app.getHttpServer())
      .post('/api/links')
      .send({
        name: 'X',
        siteA: '',
        siteB: '',
        capacityMbps: 5,
        txPowerDbm: 100,
        band: 'invalid',
        mode: 'invalid',
        channelWidthMhz: 10,
      })
      .expect(400);
  });

  it('creates a link and returns 201', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/links')
      .send({
        name: 'Contract-Test-Link',
        siteA: 'Test-A',
        siteB: 'Test-B',
        band: '5GHz',
        mode: 'PtP',
        capacityMbps: 100,
        txPowerDbm: 10,
        channelWidthMhz: 40,
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        name: 'Contract-Test-Link',
        siteA: 'Test-A',
        siteB: 'Test-B',
        band: '5GHz',
        mode: 'PtP',
        capacityMbps: 100,
        txPowerDbm: 10,
        channelWidthMhz: 40,
        version: 1,
      }),
    );
  });

  it('rejects a duplicate link name with 409', async () => {
    await request(app.getHttpServer())
      .post('/api/links')
      .send({
        name: 'Duplicate-Test-Link',
        siteA: 'A',
        siteB: 'B',
        band: '5GHz',
        mode: 'PtP',
        capacityMbps: 100,
        txPowerDbm: 10,
        channelWidthMhz: 40,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/links')
      .send({
        name: 'Duplicate-Test-Link',
        siteA: 'C',
        siteB: 'D',
        band: '11GHz',
        mode: 'S2S',
        capacityMbps: 200,
        txPowerDbm: 15,
        channelWidthMhz: 80,
      })
      .expect(409);
  });

  it('rejects a stale version update with 409', async () => {
    const linksResponse = await request(app.getHttpServer())
      .get('/api/links')
      .expect(200);

    const link = linksResponse.body[0];

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/links/${link.id}`)
      .send({
        name: `${link.name}-Updated`,
        version: link.version,
      })
      .expect(200);

    expect(updateResponse.body.version).toBe(link.version + 1);

    await request(app.getHttpServer())
      .patch(`/api/links/${link.id}`)
      .send({
        name: `${link.name}-Stale`,
        version: link.version,
      })
      .expect(409);
  });

  it('returns 404 when deleting a missing link', async () => {
    await request(app.getHttpServer())
      .delete('/api/links/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });
});
