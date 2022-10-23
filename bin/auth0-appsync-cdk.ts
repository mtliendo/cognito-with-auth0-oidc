#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { Auth0Stack } from '../lib/authStack'

const app = new cdk.App()

const auth0Stack = new Auth0Stack(app, 'Auth0AppsyncCdkStack', {
	userpoolName: 'Auth0Pool',
	domainPrefix: 'auth0-cdk',
	auth0ClientId: 'AUTH0_CLIENT_ID',
	auth0ClientSecret: 'AUTH0_CLIENT_SECRET',
	auth0IssuerUrl: 'https://AUTH0_DOMAIN_NAME.us.auth0.com',
	auth0CallbackUrls: ['http://localhost:3000/'],
	auth0LogoutUrls: ['http://localhost:3000/'],
})
