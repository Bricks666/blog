import jwt, {
	GetPublicKeyOrSecret,
	Jwt,
	JwtPayload,
	Secret,
	SignOptions,
	VerifyOptions
} from 'jsonwebtoken';

export const sign = async (
	content: string | Buffer | object,
	secretOrPrivateKey: Secret,
	options: SignOptions = {}
) => {
	return new Promise<string>((resolve, reject) => {
		jwt.sign(content, secretOrPrivateKey, options, (err, encoded) => {
			if (err) {
				return reject(err);
			}
			return resolve(encoded!);
		});
	});
};

export const verify = async <T = Jwt | JwtPayload | string>(
	token: string,
	secretOrPrivateKey: Secret | GetPublicKeyOrSecret,
	options: VerifyOptions = {}
) => {
	return new Promise<T & JwtPayload>((resolve, reject) => {
		jwt.verify(token, secretOrPrivateKey, options, (err, encoded) => {
			if (err) {
				return reject(err);
			}
			return resolve(encoded as T & JwtPayload);
		});
	});
};
