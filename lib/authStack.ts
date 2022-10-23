import * as cdk from 'aws-cdk-lib'
import { CfnOutput } from 'aws-cdk-lib'
import {
	AccountRecovery,
	UserPool,
	VerificationEmailStyle,
	UserPoolIdentityProviderOidc,
	OidcAttributeRequestMethod,
	ProviderAttribute,
	OAuthScope,
	UserPoolClientIdentityProvider,
} from 'aws-cdk-lib/aws-cognito'
import { Construct } from 'constructs'

interface AuthStackProps extends cdk.StackProps {
	readonly userpoolName: string
	readonly auth0ClientId: string
	readonly auth0ClientSecret: string
	readonly auth0IssuerUrl: string
	readonly auth0CallbackUrls: string[]
	readonly auth0LogoutUrls: string[]
	readonly domainPrefix: string
}

export class Auth0Stack extends cdk.Stack {
	public readonly userpool: UserPool
	constructor(scope: Construct, id: string, props: AuthStackProps) {
		super(scope, id, props)

		// Create a Cognito Userpool
		const userPool = new UserPool(this, `${props.userpoolName}`, {
			selfSignUpEnabled: true,
			accountRecovery: AccountRecovery.PHONE_AND_EMAIL,
			userVerification: {
				emailStyle: VerificationEmailStyle.CODE,
			},
			autoVerify: {
				email: true,
			},
			standardAttributes: {
				email: {
					required: true,
					mutable: true,
				},
			},
		})

		// Create a domain for the Userpool. This enables the hosted UI
		const userPoolDomain = userPool.addDomain('CognitoDomain', {
			cognitoDomain: {
				domainPrefix: props.domainPrefix,
			},
		})

		// Create an Auth0 Identity Provider. The domain is automatically added.
		new UserPoolIdentityProviderOidc(this, 'Auth0', {
			name: 'Auth0',
			clientId: props.auth0ClientId,
			clientSecret: props.auth0ClientSecret,
			issuerUrl: props.auth0IssuerUrl,
			userPool,
			attributeRequestMethod: OidcAttributeRequestMethod.POST,
			attributeMapping: {
				email: ProviderAttribute.other('email'),
			},
			scopes: ['email', 'profile', 'openid'],
		})

		// Add a webclient. This allows our frontend to go through Cognito to get to Auth0.
		const userPoolWebClient = userPool.addClient('webClient', {
			supportedIdentityProviders: [
				UserPoolClientIdentityProvider.custom('Auth0'),
			],

			oAuth: {
				flows: {
					authorizationCodeGrant: true,
				},
				scopes: [
					OAuthScope.OPENID,
					OAuthScope.COGNITO_ADMIN,
					OAuthScope.EMAIL,
					OAuthScope.PHONE,
					OAuthScope.PROFILE,
				],
				callbackUrls: props.auth0CallbackUrls,
				logoutUrls: props.auth0LogoutUrls,
			},
		})

		this.userpool = userPool

		new CfnOutput(this, 'UserPoolId', {
			value: userPool.userPoolId,
		})

		new CfnOutput(this, 'UserPoolClientId', {
			value: userPoolWebClient.userPoolClientId,
		})

		new CfnOutput(this, 'UserPoolDomainName', {
			value: `https://${userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com`,
		})
	}
}
