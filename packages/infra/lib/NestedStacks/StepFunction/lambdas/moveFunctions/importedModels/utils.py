import os
import requests
from requests_aws4auth import AWS4Auth

graphql_url = os.environ["GRAPHQL_URL"]
session = requests.Session()
session.auth = AWS4Auth(
    os.environ["AWS_ACCESS_KEY_ID"],
    os.environ["AWS_SECRET_ACCESS_KEY"],
    os.environ["AWS_REGION"],
    "appsync",
    session_token=os.environ["AWS_SESSION_TOKEN"],
)

query = """
mutation CREATE_COMMENT($input: CreateCommentInput!) {
    createComment(input: $input) {
        SK
        Comment
        Author
        SessionID
    }
}
"""


def send_to_appsync(SessionID, Comment, Author):
    Comment = Comment.replace('"', "'")

    variables = {
        "input": {"SessionID": SessionID, "Comment": Comment, "Author": Author}
    }

    response = session.request(
        url=graphql_url, method="POST", json={"query": query, "variables": variables}
    )

    # Check if request was successful
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(response)
