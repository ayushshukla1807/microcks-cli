/*
 * Copyright The Microcks Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package cmd

import (
	"context"
	"fmt"

	microcks "microcks.io/testcontainers-go"

	"github.com/microcks/microcks-cli/pkg/connectors"
	"github.com/testcontainers/testcontainers-go"
)

// startDryRunContainer starts an ephemeral Microcks uber container, imports the spec file,
// and returns a ready MicrocksClient, the server address for result URLs, and a teardown func.
func startDryRunContainer(ctx context.Context, specFile string) (connectors.MicrocksClient, string, func(), error) {
	fmt.Println("Starting ephemeral Microcks instance for dry-run...")

	container, err := microcks.RunContainer(ctx,
		testcontainers.WithImage("quay.io/microcks/microcks-uber:latest"),
		microcks.WithMainArtifact(specFile),
	)
	if err != nil {
		return nil, "", nil, fmt.Errorf("failed to start Microcks container: %w", err)
	}

	teardown := func() {
		fmt.Println("Terminating dry-run Microcks container...")
		if err := container.Terminate(ctx); err != nil {
			fmt.Printf("Warning: failed to terminate container: %s\n", err)
		}
	}

	apiURL, err := container.HttpEndpoint(ctx)
	if err != nil {
		teardown()
		return nil, "", nil, fmt.Errorf("failed to get container endpoint: %w", err)
	}

	mc := connectors.NewMicrocksClient(apiURL)

	fmt.Printf("Dry-run Microcks instance ready at %s\n", apiURL)
	return mc, apiURL, teardown, nil
}
