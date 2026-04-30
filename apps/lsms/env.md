NODE_ENV=local
APP_PORT=3060
APP_URL=http://localhost:3060

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=rms-test
POSTGRES_USER=admin
POSTGRES_PASSWORD=tech7admin!
POSTGRES_SCHEMA=public

# POSTGRES_HOST=aws-0-ap-northeast-2.pooler.supabase.com
# POSTGRES_PORT=6543
# POSTGRES_DB=postgres
# POSTGRES_USER=postgres.pnnsaqaoetvtsthkdcpm
# POSTGRES_PASSWORD=kDzIyu9TJnwqxVu1
# POSTGRES_SCHEMA=public

# POSTGRES_USER=postgres.bpppiiutawqcvuszvzaf
# POSTGRES_PASSWORD=g5LtUuJxWC8eX6Sf
# POSTGRES_SCHEMA=public

# JWT Config 추가
JWT_SECRET=13hjkabsud23l13asbizx
JWT_EXPIRES_IN=24h 
GLOBAL_SECRET=13hjkabsud23l13asbizx

# 부서 API(v2): 기본값은 운영/SSO 부서 트리(루미르 루트 ID 기준)·EDP 교집합만 노출함.
# 로컬 시드 부서까지 GET /api/v2/departments 등에서 보려면 all 로 설정한다.
# LSMS_DEPARTMENT_LIST_MODE=all

WEB_PUSH_PUBLIC_KEY=BIjDkj2RVRCmukBgreTh-TeXZpZ7EhR10nLXr6lumCndXkM9D8QvCnGvvR2U0ZcYNEEhlUxdD_srRB9jY2Nlp04
WEB_PUSH_PRIVATE_KEY=K3IKvIlZuci9qjpfGufuGIvkgsFV0ivW9rR-FPZ-QHA

S3_ACCESS_KEY=37dac74798f31eaa2a0d3518ba7df183
S3_SECRET_KEY=9806846cd881adb278088be1886354e0cb0a0e63fe2831fc010d4a30a41c3e5a
S3_BUCKET_NAME=rms
S3_REGION=ap-northeast-2
S3_ENDPOINT=https://pnnsaqaoetvtsthkdcpm.storage.supabase.co/storage/v1/s3



USE_SSO=true
SSO_CLIENT_ID=221f2815-c772-4d21-a657-6457d5732b61
SSO_CLIENT_SECRET=df30bb8aa82f2d42e124af0dbe358dd0a02ef5067052367a99ef8524ae8b0f56
# 라이브
# SSO_CLIENT_ID=7661f0c1-15ac-4f16-a9b9-3c3be3bb7365
# SSO_CLIENT_SECRET=7b54fb320c7cb2cb8208bb8b3c10f433a621e845830ecec775cb6b110015272e

SSO_API_URL=https://lsso.vercel.app
# SSO_API_URL=http://localhost:3030

METADATA_MANAGER_URL=https://lumir-metadata-manager.vercel.app

FIREBASE_API_KEY=AIzaSyBQ1xJlVCd43FB9xJE591MdVqoq6be_7XA
FIREBASE_AUTH_DOMAIN=lumir-notification.firebaseapp.com
FIREBASE_PROJECT_ID=lumir-notification
FIREBASE_STORAGE_BUCKET=lumir-notification.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=217443719677
FIREBASE_APP_ID=1:217443719677:web:f2b5ab79c2ec1c4cf76194
FIREBASE_MEASUREMENT_ID=G-ZG3T4FVWE2


FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=lumir-notification
FIREBASE_PRIVATE_KEY_ID=03e14d119038987e0180bbb1d001db6f2999fbf9
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDSCxcNXwXgRbXr\nXZu3loi4QR0rBkrdRGnu5/OkJXIrFCF0WiE/1XevGJlbtr2iHxwxGYmnmMpD+Dph\nsVcYktVqhoiGEvZTkiAp+0cqPpcdq7xdQWbotqUhSQOuPPYQhT5mvGgmBZRkFWnC\nHGvnRzYpOXEwKxoTmdPjZ+Q1i7Y48QXC6oXRpQV0nWDA7yASfkSbIdSoGTqCLk5S\nUSBCBiX8Q2/l0T5r4SuJYRqDiKDBo1wisY/cYs+zaPWjFidLl0I5jIMGJKEYlmI7\nPjc9DnDh3xUk4yJJ5lfL+vtFMhZ0D7SMOoj30/U2ylny82V8XA45IKhELEcEvR7r\nVOd3TDFXAgMBAAECggEAC8u8pS8XdONlVo0AwDwvfG2HtlFZpfiAHH8hQzApK7sr\nL84Z/Ow/lvFCN5DZMIAfxLAi92sQvOV1XeQoOISSgLOCekkZVVMpBEKM2hX+xZdN\n8kzIezw6pNZlYwUgaogZG4rsLGp2zXIYaOLQuoHYzFLiBOr+wWgLqsM8YTdx6duh\nOZrwwIojk1uC2qFZVxMtCBEtgVST4kKUDj4p6C4CTo7ijvE0kUuFxaxhfhlL/lXe\n25BKMmjN1WoVCLmLxmF54QEd5bmOUDLiQhttjUeNUwctip06IAZpK6x/QSKEsDf7\nZl/NevYkuCqwVDn70nFeO1kM1ebor9oJmjmSlv3Q6QKBgQD1P/sZhHXebcTQuEKQ\nP6iJhdKQUhMgTPxgcew/BxknEgxHOb/sXpYh+Z6d1S+HZ1RNXHswZyC/AeaspwYk\nJ1iOg3Cxlrq6Jerl7dHzqZuzdOss0kxMc3T8G0hS+KHSqiKcxeW9SxXRs/fmeO/i\nnad7+KCCaieFwhoftPX2EBPmLwKBgQDbQAu9/wLWYIg2BNWaDbZ1RGJjxlDcI/uM\npmdxZTi1SROA4YC/iF2ji133qDT+QGikC6dQNiLaQDVcKSENrzMsJgYxbuUv5Os8\nhTp8WpRCM7VNb7biRUcFFmByjt2xUpdkVLKi7nbdwoG7Xk8Lnycm+2CXcIUu92WD\nR9EzgvHFWQKBgQDIXNsiP8ukSv2un7sR6lAg+onKiqNBkmPlz2z5GS19dAs/7XhU\n/fmeDDeALvlDoDGJenLSWo6wPjdc+p/TzalV1SCulbw79FpyOtd6QCkKdgzkc3MO\nSo1aold2IdbjK0hX2H4XJk7PIj73tfoVpEN+zuMjaOKdLrT1Dnyb6Qq41QKBgDPi\nayTyNSSwQWuvJzFGr3f+z93Wr4n5Be1Z777Y+luESJZGRyaMScSLFZim+Kt2aIzx\nqQ2FUigd68K8hPLtFAoNkYefO6Ni4/w1dwq4kL8951jE6B2R0WW1zustPe9ZoTQA\nCyodjomaHwNNJR2V8zj5YflUil/78czocOxkv3w5AoGAahTHhUIHkSiEyQcAy95Y\nfXND6wwCF8ffEZCRzcsCE89U/SodM1Sj5H8g7nnBRZeiwNDelw9Mb8AO6JkeWM1X\nlcw0hF1u9nJ787J6aAGTYCcuuLru1cfxmCtWCB2qV/x/ajsHCwGvLh/pfThyNp2A\nbXohSR5KnEnJpdROLAmvbLs=\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@lumir-notification.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=102007938759114614541
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40lumir-notification.iam.gserviceaccount.com
FIREBASE_UNIVERSE_DOMAIN=googleapis.com


#   구글 웹팀 계정 - 7부 / lumir.tech7@gmail.com / 2025-09-10
#   apiKey: "AIzaSyBFYhav0bPOWJAd51wdiE4h0o2Jq5D9Ths",
#   authDomain: "lumir-erp.firebaseapp.com",
#   projectId: "lumir-erp",
#   storageBucket: "lumir-erp.firebasestorage.app",
#   messagingSenderId: "1026742362074",
#   appId: "1:1026742362074:web:c88069f03a861202d4eae3",
#   measurementId: "G-9V44CVY3XY"
#   VAPID: "BN77TG5cGM5FXxB4G-GXihKdRjZe49wbfZaUSn3LIyPvhPOtFJq34QRklEk0WBT5VIcIgqjzmkSOX44QlU7NDCk"
# {
#   "type": "service_account",
#   "project_id": "lumir-erp",
#   "private_key_id": "d138b72d076dd5df1fa1c907a4f475b245a44483",
#   "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCGoXd9iwrpw0As\nOT9pe+tFw7YjdrOCGXfsX7r8W3Vq4FK27V7biUBYwYMJVHKg21IZxrDIxbyWc4fS\nphu8R5tSKb3UHQXV8yiMNRoSpoVTkGHUFVRevouLR7LOMt15tnfMCTbJoZV4V6DP\n/htk2OaAar/1S88GfHDfaFE8fDYZM32C+TkX8yKjFSMn9JD9d1IAL9MvICInQ7aZ\ncu0flJwH4oLKo7hLiclT3oSvbWn6aOEbWcQIa9MY5oySPQ7D5X30B6LEMamMKLnw\nmDLaRWitOpxdkr4DvMGZz2+FxUcU9TEN71BNFEKNJsm48FdT+FNsML4XuCywNb+4\nisjBBKIBAgMBAAECggEAAMcEig8cK9XEvGijeAoHFZTb67QhFNuNqqnSGihTSw/i\n7GNeIouGKYkLBxoTrB/+Fy/jeBJTvKTrxCyxQO7jK8gZzHRzMt1Dxvz8wr4vS4hs\nNzG9Fiu4obATHU+UAbKa+hy0wjjulHaBk0fk67n4qUXMiFek6TU9X93h57TyKUa1\nojJ1t4TFvIwbNQAf9BzocQNLzRLR3vRQtafFKLWyBS5qnI4Mz9dg7Fetq4EGWao6\nTWdyLC0mWqvIhXYtNq0nbiDRecxK0Zqw7Zv7XkgH4LEgap0mNEYxGE2+Xun7jtlT\nTg7h+8cCzcJtWWsu6PE8oZIFmsPs5a4AmBb1c/eZAQKBgQC8lZsevBraWk4o94MQ\n5HFdPowIku/MaAsNBAcpIc4M3efzCGv0gwzy2MeiW02//Tp6WeXNyqp1OPLYMAXz\ny7Ir5etLum2pNyg0xfpd2Nm+Xe8eAn2YMs2HuVsWuz20tRumd8bWrt3UVTIN7X3Y\nLeWIbMgQMV/ua745pl7gyY42wQKBgQC2wkOm84yvD1d7/5kP+1o5TVahj4zWQlRp\n2L41ZcD97yB0+R0XnI7BG212mtoLWzMS/wMxpSnRVVpFPD3WBvX8awqOAcM+7s6G\nO0sFvo+fKqLPqjoYjM8DbKJlyoB84jub//C5GPPe4OqOJyvAuSXPpuZXXx2pShLM\nfO7IsBp7QQKBgQCLKbOAqLsAKufGn2/exVVKw98+bH/8zUJqZnCKT+Hn6NFDrRFN\nLHAfvQ0EqG/ln47JvxEwHcBQJKhAFKAv2j8u2coa5gYKeyN2Xip1mpKEQnk0Ig5g\nhAzbfVLUoXPVqFgxLe5TelNEX2JCmODm6GeblvrDyEvMe0Gy9SzKoLILgQKBgAlv\nF7zrf4yd1x9Af28yw2KH2nv2hAefXuoj1RW+jerNyDghj93jJ/9R4iGoNq81YvqN\nDWYnp3P12vYN+QcuTs5b3CyebKy3+RM2xlWik5lcwxDDMcKIqjr8BZoJjP5lUzxn\nRs7XOed8Zr81yG1nYUtJy0QhVc+iUjwaCt1zMbrBAoGBALsv8GugNPnwZkhIM5V5\nqtN71gS2urgiEyGKT7CTfPWb+MQwIz0wtCykl+2nd/CarBxqxjbiOND6gOUCxFEq\ne/GruO+sVakxsLhD9h2ckOuFsKWP4UTnz9BiyQ1VSVuHfhzinLdM4anCovb9XhZ3\nUXKTuMTGlEchP6q8XLdtpvKr\n-----END PRIVATE KEY-----\n",
#   "client_email": "firebase-adminsdk-fbsvc@lumir-erp.iam.gserviceaccount.com",
#   "client_id": "112100239266333748961",
#   "auth_uri": "https://accounts.google.com/o/oauth2/auth",
#   "token_uri": "https://oauth2.googleapis.com/token",
#   "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
#   "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40lumir-erp.iam.gserviceaccount.com",
#   "universe_domain": "googleapis.com"
# }
