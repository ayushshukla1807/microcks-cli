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
	"net/url"
	"strings"

	microcks "microcks.io/testcontainers-go"

	"github.com/microcks/microcks-cli/pkg/connectors"
	"github.com/testcontainers/testcontainers-go"
)

type dryRunResult struct {
	client    connectors.MicrocksClient
	apiURL    string
	container *microcks.MicrocksContainer
	teardown  func()
}

// startDryRunContainer starts an ephemeral Microcks uber container, imports the spec,
// and returns a ready client, the server address, the container, and a teardown func.
func startDryRunContainer(ctx context.Context, specFile string) (*dryRunResult, error) {
	fmt.Println("Starting ephemeral Microcks instance for dry-run...")

	container, err := microcks.RunContainer(ctx,
		testcontainers.WithImage("quay.io/microcks/microcks-uber:latest"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to start Microcks container: %w", err)
	}

	teardown := func() {
		fmt.Println("Terminating dry-run Microcks container...")
		if err := container.Terminate(ctx); err != nil {
			fmt.Printf("Warning: failed to terminate container: %s\n", err)
		}
	}

	statusCode, err := container.ImportAsMainArtifact(ctx, specFile)
	if err != nil {
		teardown()
		return nil, fmt.Errorf("failed to import spec %s: %w", specFile, err)
	}
	if statusCode != 201 {
		teardown()
		return nil, fmt.Errorf("import of %s returned status %d", specFile, statusCode)
	}
	fmt.Printf("Imported spec %s successfully\n", specFile)

	apiURL, err := container.HttpEndpoint(ctx)
	if err != nil {
		teardown()
		return nil, fmt.Errorf("failed to get container endpoint: %w", err)
	}

	mc := connectors.NewMicrocksClient(apiURL)
	fmt.Printf("Dry-run Microcks instance ready at %s\n", apiURL)

	return &dryRunResult{
		client:    mc,
		apiURL:    apiURL,
		container: container,
		teardown:  teardown,
	}, nil
}

// restMockEndpoint returns the URL at which Microcks serves the REST mock for a service.
// serviceRef is in "Name:version" format.
func (r *dryRunResult) restMockEndpoint(ctx context.Context, serviceRef string) (string, error) {
	parts := strings.SplitN(serviceRef, ":", 2)
	if len(parts) != 2 {
		return "", fmt.Errorf("invalid service ref %q - expected Name:version format", serviceRef)
	}
	endpoint, err := r.container.RestMockEndpoint(ctx, parts[0], parts[1])
	if err != nil {
		return "", err
	}
	// encode any spaces in the service name segment so the URL is valid
	parsed, err := url.Parse(endpoint)
	if err != nil {
		return endpoint, nil
	}
	return parsed.String(), nil
}
